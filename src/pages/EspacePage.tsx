import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useSession, appelerAuth } from '../app/session';
import { useT, usePrefs } from '../app/prefs';
import { simulationActivee, RECENTS_DEMO, type RecentDemo } from '../app/simulation';
import { listerFils, ilYATexte, type FilLocal } from '../app/historique';

type ActionRapide = {
  titre: string;
  desc: string;
  icone: string;
  prompt: string;
};

/**
 * Accueil du workspace — salutation, composeur, actions rapides,
 * activité récente. Tout ce qui est simulé porte son badge ; le
 * composeur mène au vrai chat (réponse simulée ou moteur réel).
 */
export const EspacePage: React.FC = () => {
  const t = useT();
  const { lang } = usePrefs();
  const { statut, compte, rafraichir, deconnecter } = useSession();
  const navigate = useNavigate();
  const sim = simulationActivee();

  const [saisie, setSaisie] = useState('');
  const [objectif, setObjectif] = useState('');
  const [sauvegarde, setSauvegarde] = useState<'idle' | 'envoi' | 'fait' | 'erreur'>('idle');
  const [erreur, setErreur] = useState<string | null>(null);
  const [fils, setFils] = useState<FilLocal[]>([]);
  const [modele, setModele] = useState<string | null>(null);

  // Historique local réel (cet appareil).
  useEffect(() => {
    setFils(listerFils());
  }, []);

  // Nom du moteur réellement configuré (jamais supposé).
  useEffect(() => {
    if (sim) return;
    fetch('/api/status')
      .then((r) => r.json())
      .then((d: { config?: { modele?: string } }) => {
        setModele(d.config?.modele ?? null);
      })
      .catch(() => setModele(null));
  }, [sim]);

  const actions: ActionRapide[] = useMemo(
    () => [
      {
        titre: t.accueil.action1Titre,
        desc: t.accueil.action1Desc,
        icone: 'fa-wand-magic-sparkles',
        prompt: t.accueil.action1Prompt,
      },
      {
        titre: t.accueil.action2Titre,
        desc: t.accueil.action2Desc,
        icone: 'fa-file-lines',
        prompt: t.accueil.action2Prompt,
      },
      {
        titre: t.accueil.action3Titre,
        desc: t.accueil.action3Desc,
        icone: 'fa-code',
        prompt: t.accueil.action3Prompt,
      },
      {
        titre: t.accueil.action4Titre,
        desc: t.accueil.action4Desc,
        icone: 'fa-graduation-cap',
        prompt: t.accueil.action4Prompt,
      },
    ],
    [t],
  );

  if (statut === 'chargement') {
    return (
      <div className="accueil accueil-chargement">
        <p className="corps" role="status">
          {t.espace.chargement}
        </p>
      </div>
    );
  }
  if (statut === 'anonyme' && !sim) {
    return <Navigate to="/login" replace />;
  }

  const prenom = (compte?.nom ?? '').trim().split(' ')[0] || t.accueil.prenomDefaut;

  const lancer = (texte: string) => {
    const contenu = texte.trim();
    if (!contenu) return;
    navigate('/chat', { state: { promptInitial: contenu } });
  };

  const envoyerObjectif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objectif.trim() || sauvegarde === 'envoi') return;
    setSauvegarde('envoi');
    setErreur(null);
    const r = await appelerAuth('/me/onboarding', { fait: true, objectif: objectif.trim() });
    if (r.ok) {
      setSauvegarde('fait');
      await rafraichir();
    } else {
      setSauvegarde('erreur');
      setErreur(r.erreur ?? t.accueil.erreurGenerique);
    }
  };

  // Activité récente : vrais fils locaux + démos badgées en simulation.
  const recents: Array<{
    genre: 'local' | 'demo';
    id: string;
    titre: string;
    quand: string;
    type: RecentDemo['type'];
  }> = [
    ...fils.slice(0, sim ? 2 : 4).map((f) => ({
      genre: 'local' as const,
      id: f.id,
      titre: f.titre,
      quand: ilYATexte(f.date, lang),
      type: 'conversation' as const,
    })),
    ...(sim
      ? RECENTS_DEMO.slice(0, 4 - Math.min(fils.length, 2)).map((r) => ({
          genre: 'demo' as const,
          id: r.titre,
          titre: lang === 'en' ? r.titreEn : r.titre,
          quand: lang === 'en' ? r.quandEn : r.quandFr,
          type: r.type,
        }))
      : []),
  ];
  const typeLabel: Record<RecentDemo['type'], string> = {
    conversation: t.accueil.typeConversation,
    projet: t.accueil.typeProjet,
    mission: t.accueil.typeMission,
  };

  return (
    <div className="accueil">
      {/* Filigrane de marque */}
      <div className="accueil-filigrane" aria-hidden="true">
        <span>{t.accueil.mot1}</span>
        <span>{t.accueil.mot2}</span>
        <span>{t.accueil.mot3}</span>
      </div>

      <section className="accueil-hero">
        <div className="accueil-logo">
          <img
            src="/assets/aura-symbol.png"
            alt="Aura"
            width={148}
            height={148}
          />
        </div>
        <h1 className="accueil-salut">
          {t.accueil.bonjour} {prenom} !
        </h1>
        <p className="accueil-tagline">
          {t.accueil.tagline1} <em className="italique-vif">{t.accueil.taglineAccent1}</em>{' '}
          {t.accueil.tagline2} <em className="italique-vif accent2">{t.accueil.taglineAccent2}</em>
        </p>
        <p className="accueil-sous">{t.accueil.sousTitre}</p>

        {/* Composeur — mène au vrai chat */}
        <form
          className="accueil-composeur"
          onSubmit={(e) => {
            e.preventDefault();
            lancer(saisie);
          }}
        >
          <textarea
            className="accueil-saisie"
            rows={2}
            placeholder={t.accueil.placeholder}
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                lancer(saisie);
              }
            }}
            aria-label={t.accueil.placeholder}
          />
          <div className="accueil-composeur-bas">
            <span className="accueil-moteur" title={t.accueil.moteurTitre}>
              <i className="fa-solid fa-bolt" />
              {sim ? t.accueil.moteurSim : (modele ?? t.accueil.moteurNon)}
            </span>
            <div className="accueil-pastilles">
              <Link to="/explore" className="accueil-pastille">
                <i className="fa-solid fa-magnifying-glass" /> {t.accueil.chipRecherche}
              </Link>
              <button
                type="button"
                className="accueil-pastille"
                onClick={() => setSaisie(t.accueil.action3Prompt)}
              >
                <i className="fa-solid fa-code" /> {t.accueil.chipCode}
              </button>
              <Link to="/missions" className="accueil-pastille">
                <i className="fa-solid fa-list-check" /> {t.accueil.chipMissions}
              </Link>
              <button
                type="submit"
                className="accueil-envoi"
                aria-label={t.accueil.envoyer}
                disabled={!saisie.trim()}
              >
                <i className="fa-solid fa-arrow-right" />
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Actions rapides */}
      <section className="accueil-actions" aria-label={t.accueil.actionsTitre}>
        {actions.map((a) => (
          <button key={a.titre} type="button" className="accueil-action" onClick={() => setSaisie(a.prompt)}>
            <span className="accueil-action-haut">
              <i className={`fa-solid ${a.icone}`} />
              <i className="fa-solid fa-arrow-right accueil-action-fleche" />
            </span>
            <strong>{a.titre}</strong>
            <span>{a.desc}</span>
          </button>
        ))}
      </section>

      {/* Premier lancement guidé (réel) */}
      {compte && !compte.onboarding.fait && (
        <section className="accueil-onboarding">
          <div>
            <h2>{t.espace.onbTitre}</h2>
            <p className="corps">{t.espace.onbSous}</p>
          </div>
          <form onSubmit={envoyerObjectif} className="accueil-onb-form">
            <input
              type="text"
              className="champ"
              placeholder={t.espace.onbObjectif}
              value={objectif}
              onChange={(e) => setObjectif(e.target.value)}
              maxLength={160}
            />
            <button type="submit" className="btn-primaire" disabled={sauvegarde === 'envoi'}>
              {sauvegarde === 'envoi' ? t.espace.onbEnvoi : t.espace.onbEnregistrer}
            </button>
          </form>
          {erreur && <p className="form-erreur">{erreur}</p>}
        </section>
      )}

      {/* Vos récents */}
      <section className="accueil-recents">
        <header className="accueil-recents-haut">
          <h2>
            <i className="fa-solid fa-clock" /> {t.accueil.recentsTitre}
          </h2>
          <Link to="/historique" className="accueil-voir-tout">
            {t.accueil.voirTout} <i className="fa-solid fa-arrow-right" />
          </Link>
        </header>
        {recents.length === 0 ? (
          <p className="accueil-recents-vide">{t.accueil.recentsVides}</p>
        ) : (
          <div className="accueil-recents-liste">
            {recents.map((r) => (
              <Link key={r.genre + r.id} to="/historique" className="accueil-recent">
                <span className="accueil-recent-icone">
                  <i className="fa-solid fa-comment-dots" />
                </span>
                <span className="accueil-recent-texte">
                  <strong>{r.titre}</strong>
                  <em>
                    {typeLabel[r.type]} · {r.quand}
                  </em>
                </span>
                {r.genre === 'demo' && <span className="badge-sim">{t.simulation.badge}</span>}
                <i className="fa-solid fa-chevron-right accueil-recent-fleche" />
              </Link>
            ))}
          </div>
        )}
        {!sim && fils.length === 0 && (
          <p className="module-note">{t.accueil.recentsNote}</p>
        )}
      </section>
    </div>
  );
};
