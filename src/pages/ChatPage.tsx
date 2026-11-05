import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../app/session';
import { useT, usePrefs } from '../app/prefs';
import { simulationActivee } from '../app/simulation';
import { Markdown } from '../components/ui/Markdown';
import { EtatChargement, EtatErreur, EtatVide, Dialogue } from '../components/ui/Primitives';
import * as api from '../services/api';
import type { Conversation, MessageChat } from '../services/types';

/**
 * Assistant — conversations persistées côté serveur (API v1), réponses
 * en streaming avec arrêt et régénération, rendu Markdown sûr, contexte
 * visible (mémoires utilisées), saisie vocale et lecture à voix haute
 * lorsque le navigateur les fournit réellement.
 */

type EtatEnvoi = 'idle' | 'envoi';

const MessageBulle: React.FC<{
  message: MessageChat;
  langue: 'fr' | 'en';
  onRegenerer?: () => void;
  enCours?: boolean;
}> = ({ message, langue, onRegenerer, enCours }) => {
  const t = useT();
  const [copie, setCopie] = useState(false);
  const [lecture, setLecture] = useState(false);
  const texte = message.content ?? message.contenu ?? '';
  const estUser = message.role === 'user';

  const lire = () => {
    if (!('speechSynthesis' in window)) return;
    if (lecture) {
      window.speechSynthesis.cancel();
      setLecture(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(texte);
    u.lang = langue === 'en' ? 'en-US' : 'fr-FR';
    u.onend = () => setLecture(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setLecture(true);
  };

  return (
    <article className={`msg ${estUser ? 'msg-user' : 'msg-ia'}`}>
      <div className="msg-bulle">
        {estUser ? (
          <p className="msg-texte">{texte}</p>
        ) : (
          <>
            <Markdown texte={texte} />
            {message.statut === 'interrompu' && (
              <p className="msg-note">{t.ws.interrompuNote}</p>
            )}
            {message.meta?.memoiresUtilisees && message.meta.memoiresUtilisees.length > 0 && (
              <p className="msg-contexte">
                <i className="fa-solid fa-brain" aria-hidden="true" /> {t.ws.contexteUtilise} :{' '}
                {message.meta.memoiresUtilisees.length} {t.ws.memoiresUtilisees}
              </p>
            )}
          </>
        )}
        {enCours && <span className="msg-curseur" aria-label={t.ws.streamEnCours} />}
      </div>
      {!estUser && !enCours && (
        <div className="msg-actions">
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(texte);
              setCopie(true);
              setTimeout(() => setCopie(false), 1500);
            }}
            aria-label={t.ws.copier}
          >
            <i className={`fa-solid ${copie ? 'fa-check' : 'fa-copy'}`} />{' '}
            {copie ? t.ws.copie : ''}
          </button>
          {'speechSynthesis' in window && (
            <button type="button" onClick={lire} aria-label={t.ws.lireVoix}>
              <i className={`fa-solid ${lecture ? 'fa-stop' : 'fa-volume-high'}`} />
            </button>
          )}
          {onRegenerer && (
            <button type="button" onClick={onRegenerer} aria-label={t.ws.regenerer}>
              <i className="fa-solid fa-rotate" />
            </button>
          )}
        </div>
      )}
    </article>
  );
};

export const ChatPage: React.FC = () => {
  const t = useT();
  const { lang } = usePrefs();
  const { statut } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const sim = simulationActivee();
  const etatNav = location.state as
    | {
        promptInitial?: string;
        fil?: { id: string; titre: string; messages: MessageChat[] };
        nouveau?: boolean;
        projectId?: string | null;
      }
    | undefined;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convActive, setConvActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const [saisie, setSaisie] = useState('');
  const [etat, setEtat] = useState<EtatEnvoi>('idle');
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [renommage, setRenommage] = useState<{ id: string; titre: string } | null>(null);
  const [streamActif, setStreamActif] = useState('');
  const [dictatee, setDictatee] = useState(false);
  const projectIdInitial = useRef<string | null>(null);

  const finRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const envoyerRef = useRef<(texte: string) => void>(() => {});
  const saisieRef = useRef<HTMLTextAreaElement | null>(null);

  const recoVocale = useMemo(
    () =>
      typeof (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition !== 'undefined' ||
      typeof (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition !== 'undefined',
    [],
  );

  /* ── Chargement de la liste des conversations ── */
  const rafraichirListe = useCallback(async (q?: string) => {
    const r = await api.listerConversations({ q });
    if (r.ok) setConversations(r.donnees.conversations);
  }, []);

  useEffect(() => {
    void rafraichirListe();
    setChargement(false);
  }, [rafraichirListe]);

  useEffect(() => {
    const timer = setTimeout(() => void rafraichirListe(recherche || undefined), 250);
    return () => clearTimeout(timer);
  }, [recherche, rafraichirListe]);

  /* ── Ouverture d'une conversation (route /chat/:id) ── */
  const ouvrir = useCallback(
    async (id: string) => {
      setErreur(null);
      setChargement(true);
      const r = await api.ouvrirConversation(id);
      setChargement(false);
      if (r.ok) {
        setConvActive(r.donnees.conversation);
        setMessages(r.donnees.messages);
        if (location.pathname !== `/chat/${id}`) navigate(`/chat/${id}`, { replace: true });
      } else {
        setErreur(r.erreur);
      }
    },
    [navigate, location.pathname],
  );

  /* ── Arrivée via l'URL ou l'état de navigation ── */
  useEffect(() => {
    if (params.id) {
      if (convActive?.id !== params.id) void ouvrir(params.id);
      return;
    }
    if (etatNav?.fil) {
      // Historique local (compat) → conversation dans la liste si elle existe.
      setMessages(etatNav.fil.messages);
      setConvActive({
        id: etatNav.fil.id,
        titre: etatNav.fil.titre,
        projectId: null,
        archive: false,
        cree: new Date().toISOString(),
        maj: new Date().toISOString(),
      });
      navigate(location.pathname, { replace: true, state: null });
      return;
    }
    if (etatNav?.nouveau || etatNav?.promptInitial) {
      setConvActive(null);
      setMessages([]);
      projectIdInitial.current = (etatNav as { projectId?: string | null })?.projectId ?? null;
      if (etatNav.promptInitial) {
        const prompt = etatNav.promptInitial;
        navigate(location.pathname, { replace: true, state: null });
        envoyerRef.current(prompt);
      } else {
        navigate(location.pathname, { replace: true, state: null });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, params.id]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages, streamActif]);

  // Arrêt propre du streaming à la fermeture.
  useEffect(() => () => abortRef.current?.abort(), []);

  /* ── Envoi ── */
  const envoyer = async (texte: string) => {
    const contenu = texte.trim();
    if (!contenu || etat === 'envoi') return;
    setErreur(null);
    setSaisie('');
    setEtat('envoi');

    let convId = convActive?.id ?? null;
    if (!convId) {
      const r = await api.creerConversation({
        titre: contenu.slice(0, 80),
        projectId: projectIdInitial.current,
      });
      if (!r.ok) {
        setErreur(r.erreur);
        setEtat('idle');
        return;
      }
      convId = r.donnees.conversation.id;
      setConvActive(r.donnees.conversation);
      projectIdInitial.current = null;
      navigate(`/chat/${convId}`, { replace: true });
      void rafraichirListe();
    }

    const localUser: MessageChat = { role: 'user', content: contenu };
    const localStream: MessageChat = { role: 'assistant', content: '' };
    setMessages((m) => [...m, localUser, localStream]);
    setStreamActif('');

    const controle = new AbortController();
    abortRef.current = controle;
    let accumule = '';

    const r = await api.envoyerMessage(convId, contenu, {
      langue: lang,
      signal: controle.signal,
      onChunk: (morceau) => {
        accumule += morceau;
        setStreamActif(accumule);
        setMessages((m) => {
          const maj = [...m];
          maj[maj.length - 1] = { role: 'assistant', content: accumule };
          return maj;
        });
      },
    });

    setStreamActif('');
    setEtat('idle');

    if (r.ok) {
      const { message, reponse } = r.donnees;
      setMessages((m) => {
        const maj = [...m];
        maj[maj.length - 2] = message;
        maj[maj.length - 1] = reponse;
        return maj;
      });
      void rafraichirListe();
    } else if (r.code === 'annule') {
      setMessages((m) => {
        const maj = [...m];
        maj[maj.length - 1] = {
          role: 'assistant',
          content: accumule,
          statut: 'interrompu',
        };
        return maj;
      });
    } else {
      setErreur(r.erreur);
      setMessages((m) => m.slice(0, -1)); // retire le fantôme de réponse
    }
  };
  envoyerRef.current = envoyer;

  /* ── Régénérer la dernière réponse ── */
  const regenerer = async () => {
    if (!convActive || etat === 'envoi') return;
    const historique = [...messages];
    while (historique.length && historique[historique.length - 1].role !== 'user') {
      historique.pop();
    }
    if (!historique.length) return;
    setMessages(historique);
    setEtat('envoi');
    const localStream: MessageChat = { role: 'assistant', content: '' };
    setMessages((m) => [...m, localStream]);
    let accumule = '';
    const controle = new AbortController();
    abortRef.current = controle;
    const r = await api.envoyerMessage(convActive.id, '', {
      langue: lang,
      stream: true,
      regenerer: true,
      signal: controle.signal,
      onChunk: (morceau) => {
        accumule += morceau;
        setMessages((m) => {
          const maj = [...m];
          maj[maj.length - 1] = { role: 'assistant', content: accumule };
          return maj;
        });
      },
    });
    setEtat('idle');
    if (r.ok) {
      setMessages((m) => {
        const maj = [...m];
        maj[maj.length - 1] = r.donnees.reponse;
        return maj;
      });
    } else if (r.code !== 'annule') {
      setErreur(r.erreur);
      setMessages((m) => m.slice(0, -1));
    }
  };

  /* ── Dictée (Web Speech API — réelle quand disponible) ── */
  const dicter = () => {
    const W = window as unknown as {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const Reco = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Reco) return;
    const reco = new Reco();
    reco.lang = lang === 'en' ? 'en-US' : 'fr-FR';
    reco.interimResults = true;
    reco.continuous = false;
    reco.onresult = (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
      const texte = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join('');
      setSaisie(texte);
    };
    reco.onend = () => setDictatee(false);
    reco.onerror = () => setDictatee(false);
    setDictatee(true);
    reco.start();
  };

  /* ── Rendu ── */
  if (statut === 'chargement') {
    return (
      <div className="chat-page">
        <EtatChargement texte={t.espace.chargement} />
      </div>
    );
  }

  return (
    <div className="chat-page">
      {/* — Colonne conversations — */}
      <aside className="chat-liste" aria-label={t.ws.conversationsTitre}>
        <div className="chat-liste-haut">
          <button
            type="button"
            className="btn-principal chat-nouveau"
            onClick={() => {
              setConvActive(null);
              setMessages([]);
              setErreur(null);
              navigate('/chat', { replace: true });
              saisieRef.current?.focus();
            }}
          >
            <i className="fa-solid fa-plus" /> {t.ws.nouvelleConv}
          </button>
          <input
            type="search"
            className="chat-recherche"
            placeholder={t.historique.recherchePlaceholder}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            aria-label={t.historique.recherchePlaceholder}
          />
        </div>
        <div className="chat-liste-items">
          {conversations.length === 0 && <p className="chat-liste-vide">{t.ws.convVide}</p>}
          {conversations.map((c) => (
            <div key={c.id} className={`chat-item${convActive?.id === c.id ? ' actif' : ''}`}>
              <button type="button" className="chat-item-ouvrir" onClick={() => void ouvrir(c.id)}>
                <span className="chat-item-titre">{c.titre}</span>
                <span className="chat-item-date">
                  {new Date(c.maj).toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR')}
                </span>
              </button>
              <span className="chat-item-actions">
                <button
                  type="button"
                  aria-label={t.ws.renommer}
                  onClick={() => setRenommage({ id: c.id, titre: c.titre })}
                >
                  <i className="fa-solid fa-pen" />
                </button>
                <button
                  type="button"
                  aria-label={t.historique.supprimer}
                  onClick={async () => {
                    if (!window.confirm(t.ws.supprimerConfirme)) return;
                    await api.supprimerConversation(c.id);
                    if (convActive?.id === c.id) {
                      setConvActive(null);
                      setMessages([]);
                      navigate('/chat', { replace: true });
                    }
                    void rafraichirListe();
                  }}
                >
                  <i className="fa-solid fa-trash" />
                </button>
              </span>
            </div>
          ))}
        </div>
      </aside>

      {/* — Zone de discussion — */}
      <section className="chat chat-colonne">
        {erreur && (
          <EtatErreur
            message={erreur}
            action={
              <button type="button" className="btn-simple" onClick={() => setErreur(null)}>
                {t.ws.reessayer}
              </button>
            }
          />
        )}

        {chargement ? (
          <EtatChargement />
        ) : messages.length === 0 ? (
          <div className="chat-accueil">
            <h1 className="chat-accueil-titre">
              {t.chat.accueil}
            </h1>
            <p className="chat-accueil-sous">{t.ws.introAide}</p>
            <div className="chat-suggestions">
              {t.chat.suggestions.map((s) => (
                <button key={s} type="button" className="chat-suggestion" onClick={() => void envoyer(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-messages">
            {messages.map((m, i) => (
              <MessageBulle
                key={m.id ?? `local-${i}`}
                message={m}
                langue={lang}
                enCours={i === messages.length - 1 && etat === 'envoi'}
                onRegenerer={
                  i === messages.length - 1 && m.role === 'assistant' && etat === 'idle'
                    ? () => void regenerer()
                    : undefined
                }
              />
            ))}
            <div ref={finRef} />
          </div>
        )}

        <form
          className="chat-composeur"
          onSubmit={(e) => {
            e.preventDefault();
            void envoyer(saisie);
          }}
        >
          <textarea
            ref={saisieRef}
            className="chat-saisie"
            rows={1}
            placeholder={t.chat.placeholder}
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void envoyer(saisie);
              }
            }}
            aria-label={t.chat.placeholder}
          />
          <div className="chat-composeur-actions">
            {recoVocale && (
              <button
                type="button"
                className={`chat-vocal${dictatee ? ' actif' : ''}`}
                onClick={dicter}
                aria-label={t.ws.dicter}
                title={t.ws.dicter}
              >
                <i className="fa-solid fa-microphone" />
              </button>
            )}
            {etat === 'envoi' ? (
              <button
                type="button"
                className="btn-principal chat-arret"
                onClick={() => abortRef.current?.abort()}
              >
                <i className="fa-solid fa-stop" /> <span>{t.ws.arreter}</span>
              </button>
            ) : (
              <button type="submit" className="btn-principal chat-envoi" disabled={!saisie.trim()}>
                <i className="fa-solid fa-paper-plane" /> <span>{t.chat.envoyer}</span>
              </button>
            )}
          </div>
        </form>
      </section>

      {/* — Renommage — */}
      <Dialogue
        ouvert={Boolean(renommage)}
        onFermer={() => setRenommage(null)}
        titre={t.ws.renommer}
        pied={
          <>
            <button type="button" className="btn-simple" onClick={() => setRenommage(null)}>
              {t.ws.annuler}
            </button>
            <button
              type="button"
              className="btn-principal"
              onClick={async () => {
                if (renommage && renommage.titre.trim()) {
                  await api.majConversation(renommage.id, { titre: renommage.titre.trim() });
                  if (convActive?.id === renommage.id) {
                    setConvActive({ ...convActive, titre: renommage.titre.trim() });
                  }
                  void rafraichirListe();
                }
                setRenommage(null);
              }}
            >
              {t.ws.enregistrer}
            </button>
          </>
        }
      >
        <label className="champ">
          <span>{t.ws.nomLabel}</span>
          <input
            type="text"
            maxLength={120}
            value={renommage?.titre ?? ''}
            onChange={(e) =>
              setRenommage((r) => (r ? { ...r, titre: e.target.value } : r))
            }
          />
        </label>
      </Dialogue>

      {/* Lien discret vers l'historique complet */}
      <Link to="/historique" className="chat-lien-historique">
        <i className="fa-solid fa-clock-rotate-left" /> {t.ws.historiqueNav}
      </Link>
    </div>
  );
};
