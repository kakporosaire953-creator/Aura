import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useT } from '../app/prefs';
import { simulationActivee } from '../app/simulation';
import {
  EtatChargement,
  EtatErreur,
  EtatVide,
} from '../components/ui/Primitives';
import { Markdown } from '../components/ui/Markdown';
import * as api from '../services/api';
import type { Creation, TypeCreation } from '../services/types';
import { Icone } from '../components/ui/Icone';

/**
 * Studio — création de livrables réelle (génération par le moteur IA
 * configuré), historique des versions, révision, export Markdown.
 * Les états sont honnêtes : sans moteur, la génération est déclarée
 * indisponible ; aucune création prédéfinie n'est présentée comme générée.
 */

const TYPES: Array<{ cle: TypeCreation; icone: string }> = [
  { cle: 'document', icone: 'file-lines' },
  { cle: 'resume', icone: 'align-left' },
  { cle: 'rapport', icone: 'chart-column' },
  { cle: 'texte_professionnel', icone: 'envelope' },
  { cle: 'publication', icone: 'newspaper' },
  { cle: 'presentation', icone: 'display' },
  { cle: 'code', icone: 'code' },
  { cle: 'plan', icone: 'sitemap' },
  { cle: 'creatif', icone: 'palette' },
];

function libelleType(t: ReturnType<typeof useT>, cle: TypeCreation): string {
  const n = TYPES.findIndex((x) => x.cle === cle);
  return t.studio.styles[n] ?? cle.replace(/_/g, ' ');
}

export const StudioPage: React.FC = () => {
  const t = useT();
  const sim = simulationActivee();
  const location = useLocation();

  const [type, setType] = useState<TypeCreation>('document');
  const [instruction, setInstruction] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [active, setActive] = useState<Creation | null>(null);
  const [versionVue, setVersionVue] = useState<number | null>(null);
  const [revision, setRevision] = useState('');
  const [dispo, setDispo] = useState<{ ok: boolean; raison?: string } | null>(null);
  const [projets, setProjets] = useState<Array<{ id: string; nom: string }>>([]);
  const [projectId, setProjectId] = useState('');

  const rafraichir = useCallback(async () => {
    const r = await api.listerCreations();
    if (r.ok) setCreations(r.donnees.jobs);
  }, []);

  useEffect(() => {
    void rafraichir();
    void (async () => {
      const caps = await api.lireCapabilities();
      if (caps.ok) setDispo(caps.donnees.studio);
      const p = await api.listerProjets();
      if (p.ok) setProjets(p.donnees.projets.map((x) => ({ id: x.id, nom: x.nom })));
    })();
  }, [rafraichir]);

  // Arrivée depuis Explorer (« devenir document »).
  useEffect(() => {
    const etat = location.state as { source?: { requete: string; synthese: string } } | null;
    if (etat?.source) {
      setInstruction(`${etat.source.requete}\n\n${etat.source.synthese.slice(0, 1500)}`);
      setType('document');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const generer = async () => {
    if (!instruction.trim() || enCours) return;
    setEnCours(true);
    setErreur(null);
    const r = await api.creerCreation({
      type,
      instruction: instruction.trim(),
      projectId: projectId || null,
    });
    setEnCours(false);
    if (r.ok) {
      setActive(r.donnees.job);
      setVersionVue(null);
      setInstruction('');
      void rafraichir();
    } else {
      setErreur(r.erreur);
    }
  };

  const reviser = async () => {
    if (!active || !revision.trim() || enCours) return;
    setEnCours(true);
    setErreur(null);
    const r = await api.reviserCreation(active.id, revision.trim());
    setEnCours(false);
    if (r.ok) {
      setActive(r.donnees.job);
      setVersionVue(null);
      setRevision('');
      void rafraichir();
    } else {
      setErreur(r.erreur);
    }
  };

  const versionAffichee = active
    ? (versionVue !== null
        ? active.versions.find((v) => v.numero === versionVue) ?? active.versions[active.versions.length - 1]
        : active.versions[active.versions.length - 1])
    : null;

  return (
    <div className="page-module studio">
      <header className="page-module-haut">
        <div>
          <h1 className="page-module-titre">{t.ws.studioNav}</h1>
          <p className="page-module-sous">{t.studio.sous}</p>
        </div>
      </header>

      {erreur && (
        <EtatErreur message={erreur} action={<button type="button" className="btn-simple" onClick={() => setErreur(null)}>{t.ws.reessayer}</button>} />
      )}
      {dispo && !dispo.ok && !sim && (
        <EtatErreur message={dispo.raison ?? t.ws.configRequise} />
      )}

      <section className="studio-creation">
        <div className="studio-types" role="group" aria-label={t.ws.typeCreationLabel}>
          {TYPES.map((x) => (
            <button
              key={x.cle}
              type="button"
              className={`studio-type${type === x.cle ? ' actif' : ''}`}
              onClick={() => setType(x.cle)}
            >
              <Icone nom={x.icone} />
              <span>{libelleType(t, x.cle)}</span>
            </button>
          ))}
        </div>

        <label className="champ">
          <span>{t.ws.instructionLabel}</span>
          <textarea
            rows={5}
            maxLength={4000}
            placeholder={t.studio.placeholder}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
          />
        </label>
        {projets.length > 0 && (
          <label className="champ">
            <span>{t.ws.enregistrerProjet}</span>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">—</option>
              {projets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          className="btn-principal"
          onClick={() => void generer()}
          disabled={!instruction.trim() || enCours || (dispo ? !dispo.ok && !sim : false)}
        >
          {enCours ? (
            <>
              <Icone nom="spinner" tourne /> {t.studio.generation}
            </>
          ) : (
            <>
              <Icone nom="studio" /> {t.ws.generer}
            </>
          )}
        </button>
      </section>

      {creations.length === 0 && !active ? (
        <EtatVide icone="studio" titre={t.ws.aucuneCreation} texte={t.studio.sous} />
      ) : (
        <div className="studio-espace">
          <aside className="studio-historique" aria-label={t.ws.versionsTitre}>
            {creations.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`studio-item${active?.id === c.id ? ' actif' : ''}`}
                onClick={async () => {
                  const d = await api.ouvrirCreation(c.id);
                  if (d.ok) {
                    setActive(d.donnees.job);
                    setVersionVue(null);
                  }
                }}
              >
                <strong>{c.titre}</strong>
                <em>
                  {libelleType(t, c.type)} ·{' '}
                  {c.statut === 'en_attente'
                    ? t.studio.generation
                    : c.statut === 'erreur'
                      ? t.ws.indisponible
                      : `${c.versions.length} ${t.ws.versionsTitre}`}
                </em>
              </button>
            ))}
          </aside>

          <div className="studio-apercu">
            {active ? (
              <>
                <header className="studio-apercu-haut">
                  <h2>{active.titre}</h2>
                  <div className="boutons">
                    {active.versions.length > 1 && (
                      <select
                        value={versionVue ?? active.versions[active.versions.length - 1]?.numero}
                        onChange={(e) => setVersionVue(Number(e.target.value))}
                        aria-label={t.ws.versionsTitre}
                      >
                        {active.versions.map((v) => (
                          <option key={v.id} value={v.numero}>
                            {t.ws.versionNumero} {v.numero} — {v.note}
                          </option>
                        ))}
                      </select>
                    )}
                    {active.versions.length > 0 && (
                      <>
                        <a className="btn-simple" href={api.urlExportCreation(active.id)} download>
                          <Icone nom="download" /> {t.ws.exporter}
                        </a>
                        <button
                          type="button"
                          className="btn-simple"
                          onClick={() => window.print()}
                          title={t.ws.exportPdf}
                        >
                          <Icone nom="print" /> {t.ws.exportPdf}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="btn-danger-simple"
                      onClick={async () => {
                        if (!window.confirm(t.ws.confirmerSuppr)) return;
                        await api.supprimerCreation(active.id);
                        setActive(null);
                        void rafraichir();
                      }}
                    >
                      <Icone nom="trash" />
                    </button>
                  </div>
                </header>

                {active.statut === 'erreur' ? (
                  <EtatErreur message={active.erreur ?? t.ws.indisponible} />
                ) : versionAffichee ? (
                  <article className="studio-document">
                    <Markdown texte={versionAffichee.contenu} />
                  </article>
                ) : (
                  <EtatChargement texte={t.studio.generation} />
                )}

                <div className="studio-revision">
                  <input
                    type="text"
                    className="champ"
                    placeholder={t.ws.revisionPlaceholder}
                    value={revision}
                    onChange={(e) => setRevision(e.target.value)}
                    maxLength={2000}
                  />
                  <button
                    type="button"
                    className="btn-principal"
                    onClick={() => void reviser()}
                    disabled={!revision.trim() || enCours}
                  >
                    <Icone nom="rotate" /> {t.ws.reviser}
                  </button>
                </div>
              </>
            ) : (
              <EtatVide titre={t.ws.aucuneCreation} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
