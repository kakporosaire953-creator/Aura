import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useSession, appelerAuth } from '../app/session';
import { useT, usePrefs } from '../app/prefs';
import { simulationActivee } from '../app/simulation';
import * as api from '../services/api';
import type { Conversation, Creation, Mission, Projet } from '../services/types';

/**
 * Vue d'ensemble — centre de pilotage personnel : salutation, composeur,
 * actions rapides, continuité de travail. Toutes les données proviennent
 * des services (API v1 ou stockage simulé étiqueté) — aucune statistique
 * ni activité inventée.
 */
export const EspacePage: React.FC = () => {
  const t = useT();
  const { lang } = usePrefs();
  const { statut, compte, rafraichir } = useSession();
  const navigate = useNavigate();
  const sim = simulationActivee();

  const [saisie, setSaisie] = useState('');
  const [objectif, setObjectif] = useState('');
  const [sauvegarde, setSauvegarde] = useState<'idle' | 'envoi' | 'fait' | 'erreur'>('idle');
  const [erreur, setErreur] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [assistantOk, setAssistantOk] = useState<boolean | null>(null);

  // Données réelles de l'utilisateur (services).
  useEffect(() => {
    let vivant = true;
    void (async () => {
      const [c, m, p, cr, caps] = await Promise.all([
        api.listerConversations(),
        api.listerMissions(),
        api.listerProjets(),
        api.listerCreations(),
        api.lireCapabilities(),
      ]);
      if (!vivant) return;
      if (c.ok) setConversations(c.donnees.conversations.slice(0, 5));
      if (m.ok) setMissions(m.donnees.missions.filter((x) => x.statut !== 'terminee' && x.statut !== 'archivee').slice(0, 4));
      if (p.ok) setProjets(p.donnees.projets.slice(0, 3));
      if (cr.ok) setCreations(cr.donnees.jobs.slice(0, 3));
      if (caps.ok) setAssistantOk(caps.donnees.assistant.ok);
    })();
    return () => {
      vivant = false;
    };
  }, []);

  const actions = useMemo(
    () => [
      { titre: t.ws.actionQuestion, icone: 'fa-comment-dots', va: () => navigate('/chat', { state: { nouveau: true } }) },
      { titre: t.ws.actionProjet, icone: 'fa-folder-plus', va: () => navigate('/projets', { state: { creer: true } }) },
      { titre: t.ws.actionMission, icone: 'fa-list-check', va: () => navigate('/missions', { state: { creer: true } }) },
      { titre: t.ws.actionDocument, icone: 'fa-file-lines', va: () => navigate('/studio') },
    ],
    [t, navigate],
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

  const quand = (iso: string) => {
    const ms = Date.now() - new Date(iso).getTime();
    const min = Math.max(0, Math.round(ms / 60000));
    if (lang === 'en') {
      if (min < 60) return `${min} min ago`;
      const h = Math.round(min / 60);
      if (h < 24) return `${h}h ago`;
      return `${Math.round(h / 24)}d ago`;
    }
    if (min < 60) return `il y a ${min} min`;
    const h = Math.round(min / 60);
    if (h < 24) return `il y a ${h} h`;
    return `il y a ${Math.round(h / 24)} j`;
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
          <img src="/assets/aura-symbol.png" alt="Aura" width={148} height={148} />
        </div>
        <h1 className="accueil-salut">
          {t.accueil.bonjour} {prenom} !
        </h1>
        <p className="accueil-tagline">
          {t.accueil.tagline1} <em className="italique-vif">{t.accueil.taglineAccent1}</em>{' '}
          {t.accueil.tagline2} <em className="italique-vif accent2">{t.accueil.taglineAccent2}</em>
        </p>
        <p className="accueil-sous">{t.ws.introAide}</p>

        {/* Composeur — mène à l'assistant */}
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
              {sim ? t.accueil.moteurSim : assistantOk ? 'Aura' : t.accueil.moteurNon}
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
      <section className="accueil-actions" aria-label={t.ws.actionsRapides}>
        {actions.map((a) => (
          <button key={a.titre} type="button" className="accueil-action" onClick={a.va}>
            <span className="accueil-action-haut">
              <i className={`fa-solid ${a.icone}`} />
              <i className="fa-solid fa-arrow-right accueil-action-fleche" />
            </span>
            <strong>{a.titre}</strong>
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

      {/* Continuité de travail — données réelles */}
      <section className="accueil-recents">
        <header className="accueil-recents-haut">
          <h2>
            <i className="fa-solid fa-clock" /> {t.ws.continuTitre}
          </h2>
          <Link to="/historique" className="accueil-voir-tout">
            {t.accueil.voirTout} <i className="fa-solid fa-arrow-right" />
          </Link>
        </header>

        {conversations.length + missions.length + projets.length + creations.length === 0 ? (
          <p className="accueil-recents-vide">{t.ws.continuVide}</p>
        ) : (
          <div className="accueil-recents-liste">
            {conversations.map((c) => (
              <Link key={c.id} to={`/chat/${c.id}`} className="accueil-recent">
                <span className="accueil-recent-icone">
                  <i className="fa-solid fa-comment-dots" />
                </span>
                <span className="accueil-recent-texte">
                  <strong>{c.titre}</strong>
                  <em>
                    {t.accueil.typeConversation} · {quand(c.maj)}
                  </em>
                </span>
                <i className="fa-solid fa-chevron-right accueil-recent-fleche" />
              </Link>
            ))}
            {projets.map((p) => (
              <Link key={p.id} to={`/projets/${p.id}`} className="accueil-recent">
                <span className="accueil-recent-icone">
                  <i className="fa-solid fa-folder-open" />
                </span>
                <span className="accueil-recent-texte">
                  <strong>{p.nom}</strong>
                  <em>
                    {t.accueil.typeProjet} · {quand(p.maj)}
                  </em>
                </span>
                <i className="fa-solid fa-chevron-right accueil-recent-fleche" />
              </Link>
            ))}
            {missions.map((m) => (
              <Link key={m.id} to="/missions" className="accueil-recent">
                <span className="accueil-recent-icone">
                  <i className="fa-solid fa-list-check" />
                </span>
                <span className="accueil-recent-texte">
                  <strong>{m.titre}</strong>
                  <em>
                    {t.accueil.typeMission} · {quand(m.maj)}
                  </em>
                </span>
                <i className="fa-solid fa-chevron-right accueil-recent-fleche" />
              </Link>
            ))}
            {creations.map((c) => (
              <Link key={c.id} to="/studio" className="accueil-recent">
                <span className="accueil-recent-icone">
                  <i className="fa-solid fa-file-lines" />
                </span>
                <span className="accueil-recent-texte">
                  <strong>{c.titre}</strong>
                  <em>
                    Studio · {quand(c.maj)}
                  </em>
                </span>
                <i className="fa-solid fa-chevron-right accueil-recent-fleche" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
