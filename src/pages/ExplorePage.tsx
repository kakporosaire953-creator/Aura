import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT, usePrefs } from '../app/prefs';
import { simulationActivee } from '../app/simulation';
import {
  EtatChargement,
  EtatErreur,
  EtatVide,
} from '../components/ui/Primitives';
import { Markdown } from '../components/ui/Markdown';
import * as api from '../services/api';
import type { Recherche, SourceRecherche } from '../services/types';
import { Icone } from '../components/ui/Icone';

/**
 * Explorer — recherche d'informations avec sources réelles (connecteur
 * indépendant du modèle de génération). Les liens proviennent du moteur
 * de recherche, jamais inventés. Sans moteur configuré, la page déclare
 * clairement l'indisponibilité — aucune recherche simulée.
 */
export const ExplorePage: React.FC = () => {
  const t = useT();
  const { lang } = usePrefs();
  const navigate = useNavigate();
  const sim = simulationActivee();

  const [requete, setRequete] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [resultat, setResultat] = useState<{ recherche: Recherche; sources: SourceRecherche[] } | null>(null);
  const [historique, setHistorique] = useState<Recherche[]>([]);
  const [dispo, setDispo] = useState<{ ok: boolean; raison?: string } | null>(null);

  useEffect(() => {
    void (async () => {
      const caps = await api.lireCapabilities();
      if (caps.ok) setDispo(caps.donnees.recherche);
      const r = await api.listerRecherches();
      if (r.ok) setHistorique(r.donnees.recherches);
    })();
  }, []);

  const lancer = useCallback(
    async (q: string) => {
      const texte = q.trim();
      if (!texte || enCours) return;
      setEnCours(true);
      setErreur(null);
      setResultat(null);
      const r = await api.lancerRecherche({ requete: texte, langue: lang });
      setEnCours(false);
      if (r.ok) {
        setResultat({ recherche: r.donnees.recherche, sources: r.donnees.sources });
        const h = await api.listerRecherches();
        if (h.ok) setHistorique(h.donnees.recherches);
      } else {
        setErreur(r.erreur);
      }
    },
    [enCours, lang],
  );

  return (
    <div className="page-module explore">
      <header className="page-module-haut">
        <div>
          <h1 className="page-module-titre">{t.ws.explorerNav}</h1>
          <p className="page-module-sous">{t.explore.sous}</p>
        </div>
      </header>

      {dispo && !dispo.ok && !sim && (
        <EtatErreur
          message={dispo.raison ?? t.ws.configRequise}
          action={
            <button type="button" className="btn-simple" onClick={() => navigate('/parametres')}>
              {t.ws.parametresNav}
            </button>
          }
        />
      )}

      <form
        className="explore-barre"
        onSubmit={(e) => {
          e.preventDefault();
          void lancer(requete);
        }}
      >
        <input
          type="search"
          className="champ"
          placeholder={t.ws.recherchePlaceholder}
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
          aria-label={t.ws.recherchePlaceholder}
        />
        <button type="submit" className="btn-principal" disabled={!requete.trim() || enCours || (dispo ? !dispo.ok : false)}>
          {enCours ? (
            <>
              <Icone nom="spinner" tourne /> {t.chat.reflexion}
            </>
          ) : (
            <>
              <Icone nom="magnifying-glass" /> {t.ws.lancer}
            </>
          )}
        </button>
      </form>

      {erreur && <EtatErreur message={erreur} action={<button type="button" className="btn-simple" onClick={() => setErreur(null)}>{t.ws.reessayer}</button>} />}

      {enCours && <EtatChargement texte={t.chat.reflexion} />}

      {resultat && (
        <section className="explore-resultat">
          <h2>{resultat.recherche.requete}</h2>
          {resultat.recherche.statut === 'sans_resultat' ? (
            <p className="module-note">{t.ws.sansResultat}</p>
          ) : (
            <div className="explore-synthese">
              <Markdown texte={resultat.recherche.synthese} />
            </div>
          )}

          <h3>{t.ws.sourcesTitre}</h3>
          {resultat.sources.length === 0 ? (
            <p className="module-note">{t.ws.aucuneSource}</p>
          ) : (
            <ul className="explore-sources">
              {resultat.sources.map((s) => (
                <li key={s.id}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    <Icone nom="link" /> {s.titre}
                  </a>
                  <span className="explore-url">{s.url}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="explore-actions">
            <button
              type="button"
              className="btn-simple"
              onClick={() => navigate('/missions', { state: { creer: true } })}
            >
              <Icone nom="list-check" /> {t.ws.devenirMission}
            </button>
            <button
              type="button"
              className="btn-simple"
              onClick={() => navigate('/studio', { state: { source: resultat.recherche } })}
            >
              <Icone nom="file-lines" /> {t.ws.devenirDocument}
            </button>
          </div>
        </section>
      )}

      {historique.length > 0 && (
        <section className="explore-historique">
          <h2>{t.ws.historiqueRecherches}</h2>
          <div className="liste-simple">
            {historique.slice(0, 10).map((r) => (
              <button
                key={r.id}
                type="button"
                className="ligne-simple ligne-ouvrir"
                onClick={async () => {
                  const detail = await api.ouvrirRecherche(r.id);
                  if (detail.ok) {
                    setResultat({ recherche: detail.donnees.recherche, sources: detail.donnees.sources });
                  }
                }}
              >
                <Icone nom="clock-rotate-left" />
                <strong>{r.requete}</strong>
                <em>{new Date(r.cree).toLocaleDateString()}</em>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
