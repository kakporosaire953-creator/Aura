import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SiteNav, SiteFooter } from '../components/layout/SiteChrome';
import { useSession } from '../app/session';
import { useT, usePrefs } from '../app/prefs';

type MessageChat = { role: 'user' | 'assistant'; content: string };

/**
 * Chat — conversation réelle avec le moteur Gemini côté serveur.
 * États honnêtes : connexion requise, configuration manquante,
 * erreurs du modèle affichées telles quelles. Jamais de réponse simulée.
 */
export const ChatPage: React.FC = () => {
  const t = useT();
  const { lang } = usePrefs();
  const { statut, compte } = useSession();
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const [saisie, setSaisie] = useState('');
  const [etat, setEtat] = useState<'idle' | 'envoi'>('idle');
  const [erreur, setErreur] = useState<string | null>(null);
  const [config, setConfig] = useState<'inconnu' | 'ok' | 'manquante'>('inconnu');
  const finRef = useRef<HTMLDivElement | null>(null);

  // État réel du service de chat (clé serveur présente ou non).
  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((d: { features?: { chat?: string } }) => {
        setConfig(d.features?.chat === 'live' ? 'ok' : 'manquante');
      })
      .catch(() => setConfig('inconnu'));
  }, []);

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages, etat]);

  const envoyer = async (texte: string) => {
    const contenu = texte.trim();
    if (!contenu || etat === 'envoi') return;
    setErreur(null);
    setSaisie('');
    const suite: MessageChat[] = [...messages, { role: 'user', content: contenu }];
    setMessages(suite);
    setEtat('envoi');

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: suite, langue: lang }),
      });
      const d = (await r.json().catch(() => ({}))) as {
        reponse?: string;
        error?: string;
        code?: string;
      };
      if (r.ok && d.reponse) {
        setMessages((m) => [...m, { role: 'assistant', content: d.reponse! }]);
      } else {
        setErreur(
          d.code === 'chat-indisponible'
            ? t.chat.setupNote
            : d.error || t.chat.errEnvoi,
        );
      }
    } catch {
      setErreur(t.chat.errEnvoi);
    } finally {
      setEtat('idle');
    }
  };

  return (
    <div className="chat-page">
      <SiteNav />

      <main className="chat">
        <header className="chat-entete">
          <span className="kicker">{t.chat.kicker}</span>
          <h1 className="display-lg">
            {t.chat.titre1} <em className="italique-vif">{t.chat.titre2}</em>.
          </h1>
          <p className="sous-titre">{t.chat.sous}</p>
        </header>

        {config === 'manquante' && (
          <div className="chat-banniere" role="status">
            <i className="fa-solid fa-screwdriver-wrench" aria-hidden />
            <span>{t.chat.setupNote}</span>
          </div>
        )}

        {statut === 'anonyme' ? (
          <div className="chat-connexion">
            <p className="corps">{t.chat.connexionSous}</p>
            <Link to="/login" className="btn btn-ruban">
              <span>{t.chat.connexionBtn}</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="chat-messages" aria-live="polite">
              {messages.length === 0 && etat !== 'envoi' && (
                <div className="chat-accueil">
                  <p className="display-md">{t.chat.accueil}</p>
                  <div className="chat-suggestions">
                    {t.chat.suggestions.map((s) => (
                      <button type="button" key={s} onClick={() => void envoyer(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div className={`chat-message ${m.role}`} key={i}>
                  <span className="chat-bulle">{m.content}</span>
                </div>
              ))}

              {etat === 'envoi' && (
                <div className="chat-message assistant">
                  <span className="chat-bulle chat-attente" role="status">
                    {t.chat.reflexion}
                  </span>
                </div>
              )}

              {erreur && (
                <div className="form-erreur" role="alert">
                  <i className="fa-solid fa-circle-exclamation" aria-hidden /> {erreur}
                </div>
              )}
              <div ref={finRef} />
            </div>

            <form
              className="chat-saisie"
              onSubmit={(e) => {
                e.preventDefault();
                void envoyer(saisie);
              }}
            >
              <input
                type="text"
                className="form-champ"
                placeholder={t.chat.placeholder}
                value={saisie}
                onChange={(e) => setSaisie(e.target.value)}
                maxLength={4000}
                aria-label={t.chat.placeholder}
              />
              <button
                type="submit"
                className="btn btn-ruban"
                disabled={etat === 'envoi' || !saisie.trim()}
              >
                <i className="fa-solid fa-paper-plane" aria-hidden />
                <span>{etat === 'envoi' ? t.chat.envoi : t.chat.envoyer}</span>
              </button>
            </form>
            <p className="chat-note">{t.chat.note}</p>
          </>
        )}

        {statut === 'connecte' && (
          <p className="chat-note">
            {t.chat.connecte} <strong>{compte?.email}</strong>
          </p>
        )}
      </main>

      <SiteFooter />
    </div>
  );
};
