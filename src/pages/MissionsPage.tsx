import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useT } from '../app/prefs';
import { simulationActivee } from '../app/simulation';
import {
  Dialogue,
  EtatChargement,
  EtatErreur,
  EtatVide,
} from '../components/ui/Primitives';
import * as api from '../services/api';
import type {
  Mission,
  PrioriteMission,
  PropositionMission,
  StatutMission,
} from '../services/types';

/**
 * Missions — gestionnaire de travail réellement persisté (API v1).
 * Vues liste / tableau / échéances, sous-tâches, priorités, notes.
 * L'assistance IA propose une décomposition que l'utilisateur valide
 * ou modifie avant tout enregistrement.
 */

const STATUTS: StatutMission[] = ['a_faire', 'en_cours', 'en_attente', 'terminee', 'archivee'];
const COLONNES_KANBAN: StatutMission[] = ['a_faire', 'en_cours', 'en_attente', 'terminee'];

type FormulaireMission = {
  titre: string;
  description: string;
  priorite: PrioriteMission;
  statut: StatutMission;
  echeance: string;
  notes: string;
  sousTaches: string[];
};

const FORM_VIDE: FormulaireMission = {
  titre: '',
  description: '',
  priorite: 'moyenne',
  statut: 'a_faire',
  echeance: '',
  notes: '',
  sousTaches: [],
};

function libelleStatut(t: ReturnType<typeof useT>, s: StatutMission): string {
  switch (s) {
    case 'a_faire':
      return t.ws.statutAFaire;
    case 'en_cours':
      return t.ws.statutEnCours;
    case 'en_attente':
      return t.ws.statutEnAttente;
    case 'terminee':
      return t.ws.statutTerminee;
    default:
      return t.ws.statutArchivee;
  }
}

function libellePriorite(t: ReturnType<typeof useT>, p: PrioriteMission): string {
  switch (p) {
    case 'basse':
      return t.ws.prioBasse;
    case 'haute':
      return t.ws.prioHaute;
    case 'urgente':
      return t.ws.prioUrgente;
    default:
      return t.ws.prioMoyenne;
  }
}

export const MissionsPage: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const sim = simulationActivee();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [vue, setVue] = useState<'liste' | 'kanban' | 'echeances'>('liste');
  const [formulaire, setFormulaire] = useState<FormulaireMission | null>(null);
  const [edition, setEdition] = useState<(FormulaireMission & { id: string }) | null>(null);
  const [aideOuverte, setAideOuverte] = useState(false);
  const [aideObjectif, setAideObjectif] = useState('');
  const [aideEtat, setAideEtat] = useState<'idle' | 'envoi' | 'erreur'>('idle');
  const [aideErreur, setAideErreur] = useState<string | null>(null);
  const [propositions, setPropositions] = useState<PropositionMission[] | null>(null);
  const [aideNote, setAideNote] = useState('');

  const rafraichir = useCallback(async () => {
    const r = await api.listerMissions();
    if (r.ok) setMissions(r.donnees.missions.filter((m) => m.statut !== 'archivee'));
    else setErreur(r.erreur);
    setChargement(false);
  }, []);

  useEffect(() => {
    void rafraichir();
  }, [rafraichir]);

  useEffect(() => {
    const etat = location.state as { creer?: boolean } | null;
    if (etat?.creer) {
      setFormulaire({ ...FORM_VIDE });
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  /* ── CRUD ── */

  const creer = async (f: FormulaireMission) => {
    const r = await api.creerMission({
      titre: f.titre.trim(),
      description: f.description,
      priorite: f.priorite,
      statut: f.statut,
      echeance: f.echeance || null,
      notes: f.notes,
      sousTaches: f.sousTaches.filter(Boolean),
    });
    if (r.ok) {
      setFormulaire(null);
      void rafraichir();
    } else {
      setErreur(r.erreur);
    }
  };

  const modifier = async (id: string, patch: Partial<Mission>) => {
    const r = await api.majMission(id, patch);
    if (r.ok) void rafraichir();
    else setErreur(r.erreur);
  };

  const supprimer = async (id: string) => {
    if (!window.confirm(t.ws.confirmerSuppr)) return;
    await api.supprimerMission(id);
    void rafraichir();
  };

  /* ── Assistance IA (proposition, puis validation utilisateur) ── */

  const demanderAide = async () => {
    if (!aideObjectif.trim() || aideEtat === 'envoi') return;
    setAideEtat('envoi');
    setAideErreur(null);
    const r = await api.aideMissions(aideObjectif.trim());
    setAideEtat('idle');
    if (r.ok) {
      setPropositions(r.donnees.proposition);
      setAideNote(r.donnees.note);
    } else {
      setAideErreur(r.erreur);
      setAideEtat('erreur');
    }
  };

  const validerPropositions = async () => {
    if (!propositions) return;
    const r = await api.creerMissions(
      propositions.map((p) => ({
        titre: p.titre,
        description: p.description,
        priorite: p.priorite,
        echeance: p.echeance,
        sousTaches: p.sousTaches,
      })),
    );
    if (r.ok) {
      setPropositions(null);
      setAideOuverte(false);
      setAideObjectif('');
      void rafraichir();
    } else {
      setAideErreur(r.erreur);
    }
  };

  /* ── Vues ── */

  const parStatut = useMemo(() => {
    const m = new Map<StatutMission, Mission[]>();
    for (const s of STATUTS) m.set(s, []);
    for (const mission of missions) m.get(mission.statut)?.push(mission);
    return m;
  }, [missions]);

  const avecEcheance = useMemo(
    () =>
      [...missions]
        .filter((m) => m.echeance && m.statut !== 'terminee')
        .sort((a, b) => (a.echeance! < b.echeance! ? -1 : 1)),
    [missions],
  );

  const CarteMission: React.FC<{ m: Mission; compact?: boolean }> = ({ m, compact }) => {
    const [ouvert, setOuvert] = useState(false);
    const faits = m.sousTaches.filter((s) => s.fait).length;
    return (
      <div className={`mission-carte prio-${m.priorite}${compact ? ' compact' : ''}`}>
        <div className="mission-carte-haut">
          <button
            type="button"
            className="mission-titre-btn"
            onClick={() => setOuvert((v) => !v)}
            aria-expanded={ouvert}
          >
            <strong>{m.titre}</strong>
          </button>
          <span className={`badge badge-${m.priorite === 'urgente' || m.priorite === 'haute' ? 'feu' : m.priorite === 'basse' ? 'neutre' : 'or'}`}>
            {libellePriorite(t, m.priorite)}
          </span>
        </div>
        {m.echeance && (
          <p className="mission-echeance">
            <i className="fa-solid fa-calendar" /> {m.echeance}
          </p>
        )}
        {m.sousTaches.length > 0 && (
          <p className="mission-progression">
            <i className="fa-solid fa-bars-progress" /> {faits}/{m.sousTaches.length}
          </p>
        )}
        {ouvert && (
          <div className="mission-detail">
            {m.description && <p className="corps">{m.description}</p>}
            {m.sousTaches.length > 0 && (
              <ul className="mission-soustaches">
                {m.sousTaches.map((s) => (
                  <li key={s.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={s.fait}
                        onChange={() =>
                          void modifier(m.id, {
                            sousTaches: m.sousTaches.map((x) =>
                              x.id === s.id ? { ...x, fait: !x.fait } : x,
                            ),
                          })
                        }
                      />
                      <span className={s.fait ? 'fait' : ''}>{s.titre}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <div className="mission-actions">
              <select
                value={m.statut}
                aria-label={t.ws.prioriteLabel}
                onChange={(e) => void modifier(m.id, { statut: e.target.value as StatutMission })}
              >
                {STATUTS.map((s) => (
                  <option key={s} value={s}>
                    {libelleStatut(t, s)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-simple"
                onClick={() =>
                  setEdition({
                    id: m.id,
                    titre: m.titre,
                    description: m.description,
                    priorite: m.priorite,
                    statut: m.statut,
                    echeance: m.echeance ?? '',
                    notes: m.notes,
                    sousTaches: m.sousTaches.map((s) => s.titre),
                  })
                }
              >
                <i className="fa-solid fa-pen" />
              </button>
              <button type="button" className="btn-danger-simple" onClick={() => void supprimer(m.id)}>
                <i className="fa-solid fa-trash" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-module">
      <header className="page-module-haut">
        <div>
          <h1 className="page-module-titre">{t.ws.missionsNav}</h1>
          <p className="page-module-sous">{t.ws.aideIaNote}</p>
        </div>
        <div className="page-module-actions">
          <div className="boutons-vue" role="group" aria-label="Vue">
            <button type="button" className={vue === 'liste' ? 'actif' : ''} onClick={() => setVue('liste')}>
              <i className="fa-solid fa-list" /> {t.ws.vueListe}
            </button>
            <button type="button" className={vue === 'kanban' ? 'actif' : ''} onClick={() => setVue('kanban')}>
              <i className="fa-solid fa-table-columns" /> {t.ws.vueKanban}
            </button>
            <button type="button" className={vue === 'echeances' ? 'actif' : ''} onClick={() => setVue('echeances')}>
              <i className="fa-solid fa-calendar" /> {t.ws.vueEcheances}
            </button>
          </div>
          <button type="button" className="btn-simple" onClick={() => setAideOuverte(true)}>
            <i className="fa-solid fa-wand-magic-sparkles" /> {t.ws.aideIa}
          </button>
          <button type="button" className="btn-principal" onClick={() => setFormulaire({ ...FORM_VIDE })}>
            <i className="fa-solid fa-plus" /> {t.ws.nouvelleMission}
          </button>
        </div>
      </header>

      {erreur && (
        <EtatErreur message={erreur} action={<button type="button" className="btn-simple" onClick={() => setErreur(null)}>{t.ws.reessayer}</button>} />
      )}

      {chargement ? (
        <EtatChargement />
      ) : missions.length === 0 ? (
        <EtatVide
          icone="fa-list-check"
          titre={t.ws.nouvelleMission}
          texte={t.ws.aideIaNote}
          action={
            <div className="boutons">
              <button type="button" className="btn-principal" onClick={() => setFormulaire({ ...FORM_VIDE })}>
                {t.ws.nouvelleMission}
              </button>
              <button type="button" className="btn-simple" onClick={() => setAideOuverte(true)}>
                {t.ws.aideIa}
              </button>
            </div>
          }
        />
      ) : vue === 'liste' ? (
        <div className="missions-liste">
          {missions.map((m) => (
            <CarteMission key={m.id} m={m} />
          ))}
        </div>
      ) : vue === 'kanban' ? (
        <div className="missions-kanban">
          {COLONNES_KANBAN.map((s) => (
            <section key={s} className="kanban-colonne">
              <h2>
                {libelleStatut(t, s)} <span className="onglet-n">{(parStatut.get(s) ?? []).length}</span>
              </h2>
              {(parStatut.get(s) ?? []).map((m) => (
                <div key={m.id} className="kanban-carte">
                  <CarteMission m={m} compact />
                  <select
                    value={m.statut}
                    aria-label={t.ws.prioriteLabel}
                    onChange={(e) => void modifier(m.id, { statut: e.target.value as StatutMission })}
                  >
                    {STATUTS.filter((x) => x !== 'archivee').map((x) => (
                      <option key={x} value={x}>
                        {libelleStatut(t, x)}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </section>
          ))}
        </div>
      ) : (
        <div className="missions-echeances">
          {avecEcheance.length === 0 ? (
            <EtatVide titre={t.ws.vueEcheances} />
          ) : (
            avecEcheance.map((m) => {
              const retard = m.echeance! < new Date().toISOString().slice(0, 10);
              return (
                <div key={m.id} className={`echeance-ligne${retard ? ' retard' : ''}`}>
                  <span className="echeance-date">{m.echeance}</span>
                  <strong>{m.titre}</strong>
                  <em>{libelleStatut(t, m.statut)}</em>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* — Création / édition — */}
      <Dialogue
        ouvert={Boolean(formulaire || edition)}
        onFermer={() => {
          setFormulaire(null);
          setEdition(null);
        }}
        titre={edition ? t.ws.renommer : t.ws.nouvelleMission}
        large
        pied={
          <>
            <button
              type="button"
              className="btn-simple"
              onClick={() => {
                setFormulaire(null);
                setEdition(null);
              }}
            >
              {t.ws.annuler}
            </button>
            <button
              type="button"
              className="btn-principal"
              onClick={() => {
                if (edition) {
                  void modifier(edition.id, {
                    titre: edition.titre.trim(),
                    description: edition.description,
                    priorite: edition.priorite,
                    statut: edition.statut,
                    echeance: edition.echeance || null,
                    notes: edition.notes,
                    sousTaches: undefined,
                  });
                  setEdition(null);
                } else if (formulaire && formulaire.titre.trim()) {
                  void creer(formulaire);
                }
              }}
            >
              {t.ws.enregistrer}
            </button>
          </>
        }
      >
        {(formulaire || edition) && (
          <FormulaireMissionChamp
            valeur={formulaire ?? edition!}
            onChange={(v) => (edition ? setEdition({ ...v, id: edition.id }) : setFormulaire(v))}
          />
        )}
      </Dialogue>

      {/* — Assistance IA — */}
      <Dialogue
        ouvert={aideOuverte}
        onFermer={() => {
          setAideOuverte(false);
          setPropositions(null);
        }}
        titre={t.ws.aideIa}
        large
        pied={
          propositions ? (
            <>
              <button type="button" className="btn-simple" onClick={() => setPropositions(null)}>
                {t.ws.annuler}
              </button>
              <button type="button" className="btn-principal" onClick={() => void validerPropositions()}>
                {t.ws.validerProposition}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-principal"
              onClick={() => void demanderAide()}
              disabled={!aideObjectif.trim() || aideEtat === 'envoi'}
            >
              {aideEtat === 'envoi' ? t.chat.reflexion : t.ws.aideIa}
            </button>
          )
        }
      >
        {!propositions ? (
          <div className="formulaire">
            <label className="champ">
              <span>{t.ws.aideIaPlaceholder}</span>
              <textarea
                rows={4}
                maxLength={2000}
                value={aideObjectif}
                onChange={(e) => setAideObjectif(e.target.value)}
                placeholder={t.ws.aideIaPlaceholder}
              />
            </label>
            <em className="champ-aide">{t.ws.aideIaNote}</em>
            {aideErreur && <p className="form-erreur">{aideErreur}</p>}
            {sim && <p className="module-note">{aideNote}</p>}
          </div>
        ) : (
          <div className="propositions">
            <p className="module-note">{aideNote}</p>
            {propositions.map((p, i) => (
              <div key={i} className="proposition-carte">
                <div className="proposition-haut">
                  <input
                    type="text"
                    value={p.titre}
                    onChange={(e) =>
                      setPropositions(
                        propositions.map((x, j) => (j === i ? { ...x, titre: e.target.value } : x)),
                      )
                    }
                  />
                  <select
                    value={p.priorite}
                    onChange={(e) =>
                      setPropositions(
                        propositions.map((x, j) =>
                          j === i ? { ...x, priorite: e.target.value as PrioriteMission } : x,
                        ),
                      )
                    }
                  >
                    {(['basse', 'moyenne', 'haute', 'urgente'] as PrioriteMission[]).map((v) => (
                      <option key={v} value={v}>
                        {libellePriorite(t, v)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-danger-simple"
                    onClick={() => setPropositions(propositions.filter((_, j) => j !== i))}
                    aria-label={t.ws.confirmer}
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={p.description}
                  onChange={(e) =>
                    setPropositions(
                      propositions.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)),
                    )
                  }
                />
                {p.sousTaches.length > 0 && (
                  <ul className="proposition-soustaches">
                    {p.sousTaches.map((s, k) => (
                      <li key={k}>
                        <i className="fa-solid fa-corner" aria-hidden="true" /> {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </Dialogue>
    </div>
  );
};

/* ── Sous-composant formulaire ── */

const FormulaireMissionChamp: React.FC<{
  valeur: FormulaireMission;
  onChange: (v: FormulaireMission) => void;
}> = ({ valeur, onChange }) => {
  const t = useT();
  return (
    <div className="formulaire">
      <label className="champ">
        <span>{t.ws.nomLabel} *</span>
        <input
          type="text"
          maxLength={120}
          value={valeur.titre}
          onChange={(e) => onChange({ ...valeur, titre: e.target.value })}
          required
        />
      </label>
      <label className="champ">
        <span>{t.ws.descriptionLabel}</span>
        <textarea
          rows={3}
          maxLength={4000}
          value={valeur.description}
          onChange={(e) => onChange({ ...valeur, description: e.target.value })}
        />
      </label>
      <div className="champs-ligne">
        <label className="champ">
          <span>{t.ws.prioriteLabel}</span>
          <select
            value={valeur.priorite}
            onChange={(e) => onChange({ ...valeur, priorite: e.target.value as PrioriteMission })}
          >
            {(['basse', 'moyenne', 'haute', 'urgente'] as PrioriteMission[]).map((p) => (
              <option key={p} value={p}>
                {libellePriorite(t, p)}
              </option>
            ))}
          </select>
        </label>
        <label className="champ">
          <span>{t.ws.echeanceLabel}</span>
          <input
            type="date"
            value={valeur.echeance}
            onChange={(e) => onChange({ ...valeur, echeance: e.target.value })}
          />
        </label>
        <label className="champ">
          <span>{libelleStatut(t, valeur.statut)}</span>
          <select
            value={valeur.statut}
            onChange={(e) => onChange({ ...valeur, statut: e.target.value as StatutMission })}
          >
            {STATUTS.map((s) => (
              <option key={s} value={s}>
                {libelleStatut(t, s)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="champ">
        <span>{t.ws.notesLabel}</span>
        <textarea
          rows={2}
          maxLength={4000}
          value={valeur.notes}
          onChange={(e) => onChange({ ...valeur, notes: e.target.value })}
        />
      </label>
      <fieldset className="champ">
        <legend>{t.ws.sousTachesLabel}</legend>
        {valeur.sousTaches.map((s, i) => (
          <div key={i} className="soustache-ligne">
            <input
              type="text"
              value={s}
              onChange={(e) =>
                onChange({
                  ...valeur,
                  sousTaches: valeur.sousTaches.map((x, j) => (j === i ? e.target.value : x)),
                })
              }
            />
            <button
              type="button"
              className="btn-danger-simple"
              onClick={() =>
                onChange({ ...valeur, sousTaches: valeur.sousTaches.filter((_, j) => j !== i) })
              }
              aria-label={t.ws.confirmer}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn-simple"
          onClick={() => onChange({ ...valeur, sousTaches: [...valeur.sousTaches, ''] })}
        >
          <i className="fa-solid fa-plus" /> {t.ws.ajouterSousTache}
        </button>
      </fieldset>
    </div>
  );
};
