import React, { useEffect, useState } from 'react';
import { useT } from '../app/prefs';
import { MISSIONS_INITIALES, simulationActivee, type MissionSimulee } from '../app/simulation';

/**
 * Missions — tableau de projets.
 *
 * Les missions créées par l'utilisateur sont conservées localement dans
 * ce navigateur (localStorage versionné), comme l'historique du chat.
 * Il n'y a aucune synchronisation serveur : ce n'est pas une sauvegarde
 * cloud, et la note de page le dit explicitement. Les missions de
 * démonstration n'apparaissent qu'en mode simulation, badgées.
 */

type MissionLocale = MissionSimulee & { id: string };

const CLE_MISSIONS = 'aura_missions_v1';

function nouvelId(): string {
  return `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Validation d'une mission stockée : toute donnée corrompue est ignorée. */
function valider(brut: unknown): MissionLocale | null {
  if (!brut || typeof brut !== 'object') return null;
  const m = brut as Record<string, unknown>;
  if (typeof m.titre !== 'string' || !m.titre.trim() || m.titre.length > 120) return null;
  const colonne = Number(m.colonne);
  if (colonne !== 0 && colonne !== 1 && colonne !== 2) return null;
  const progression = Number(m.progression);
  if (!Number.isFinite(progression) || progression < 0 || progression > 100) return null;
  const etiquettes = Array.isArray(m.etiquettes)
    ? m.etiquettes.filter((e): e is string => typeof e === 'string' && e.length <= 40).slice(0, 5)
    : [];
  return {
    id: typeof m.id === 'string' && m.id ? m.id : nouvelId(),
    titre: m.titre.trim(),
    colonne: colonne as 0 | 1 | 2,
    etiquettes,
    progression: Math.round(progression),
  };
}

/** Charge les missions locales ; null = rien de valide n'a encore été stocké. */
function charger(): MissionLocale[] | null {
  try {
    const brut: unknown = JSON.parse(localStorage.getItem(CLE_MISSIONS) ?? 'null');
    if (!brut || typeof brut !== 'object') return null;
    const liste = (brut as { missions?: unknown }).missions;
    if (!Array.isArray(liste)) return null;
    const valides: MissionLocale[] = [];
    for (const m of liste) {
      const v = valider(m);
      if (v) valides.push(v);
    }
    return valides;
  } catch {
    return null; // stockage corrompu : on repart proprement
  }
}

function sauver(missions: MissionLocale[]): void {
  try {
    localStorage.setItem(CLE_MISSIONS, JSON.stringify({ version: 1, missions }));
  } catch {
    /* stockage indisponible */
  }
}

function avecIds(missions: MissionSimulee[]): MissionLocale[] {
  return missions.map((m) => ({ ...m, id: nouvelId() }));
}

export const MissionsPage: React.FC = () => {
  const t = useT();
  const sim = simulationActivee();
  const [missions, setMissions] = useState<MissionLocale[]>(() => {
    const locales = charger();
    if (locales) return locales;
    // Rien de stocké : démonstration de départ (badgée) en mode simulation,
    // tableau vide ailleurs — jamais de faux contenu présenté comme réel.
    return sim ? avecIds(MISSIONS_INITIALES) : [];
  });
  const [nouvelle, setNouvelle] = useState('');

  useEffect(() => {
    sauver(missions);
  }, [missions]);

  const ajouter = (e: React.FormEvent) => {
    e.preventDefault();
    const titre = nouvelle.trim();
    if (!titre) return;
    setMissions((m) => [
      { id: nouvelId(), titre, colonne: 0, etiquettes: [t.missions.nouvelleEtiquette], progression: 0 },
      ...m,
    ]);
    setNouvelle('');
  };

  const supprimer = (id: string) => {
    setMissions((m) => m.filter((x) => x.id !== id));
  };

  const deplacer = (id: string) => {
    setMissions((m) =>
      m.map((x) => (x.id === id ? { ...x, colonne: ((x.colonne + 1) % 3) as 0 | 1 | 2 } : x)),
    );
  };

  const progresser = (id: string, valeur: number) => {
    setMissions((m) => m.map((x) => (x.id === id ? { ...x, progression: valeur } : x)));
  };

  const colonnes: Array<{ index: 0 | 1 | 2; titre: string }> = [
    { index: 0, titre: t.missions.colonnes[0] },
    { index: 1, titre: t.missions.colonnes[1] },
    { index: 2, titre: t.missions.colonnes[2] },
  ];

  return (
    <div className="module-page">
      <section className="module wrap">
        <header className="module-entete">
          <span className="kicker">{t.missions.kicker}</span>
          <h1 className="display-xl">
            {t.missions.titre1} <em className="italique-vif">{t.missions.titre2}</em>.
          </h1>
          <p className="sous-titre">{t.missions.sous}</p>
        </header>

        <form className="missions-barre" onSubmit={ajouter}>
          <input
            type="text"
            className="form-champ"
            placeholder={t.missions.nouvellePlaceholder}
            value={nouvelle}
            onChange={(e) => setNouvelle(e.target.value)}
            maxLength={120}
            aria-label={t.missions.nouvellePlaceholder}
          />
          <button type="submit" className="btn btn-ruban">
            <i className="fa-solid fa-plus" aria-hidden />
            <span>{t.missions.ajouter}</span>
          </button>
        </form>

        <section className="missions-tableau" aria-label={t.missions.kicker}>
          {sim && <span className="badge-sim">{t.simulation.badge}</span>}
          {colonnes.map((col) => (
            <div className="missions-colonne" key={col.index}>
              <h2 className="display-md">
                {col.titre}
                <span className="missions-compte">
                  {missions.filter((m) => m.colonne === col.index).length}
                </span>
              </h2>
              <div className="missions-liste">
                {missions.filter((m) => m.colonne === col.index).length === 0 ? (
                  <p className="missions-vide">{t.missions.vide}</p>
                ) : (
                  missions
                    .filter((m) => m.colonne === col.index)
                    .map((m) => (
                      <article className="mission-carte" key={m.id}>
                        <h3>{m.titre}</h3>
                        <div className="mission-etiquettes">
                          {m.etiquettes.map((e) => (
                            <span key={e}>{e}</span>
                          ))}
                        </div>
                        <div className="mission-progression">
                          <span style={{ width: `${m.progression}%` }} />
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={m.progression}
                          className="mission-range"
                          aria-label={`${t.missions.progression} : ${m.titre}`}
                          onChange={(e) => progresser(m.id, Number(e.target.value))}
                        />
                        <div className="mission-actions">
                          <span className="mission-pourcent">{m.progression}%</span>
                          <span className="mission-boutons">
                            <button
                              type="button"
                              className="mission-action"
                              aria-label={`${t.missions.deplacer} : ${m.titre}`}
                              title={t.missions.deplacer}
                              onClick={() => deplacer(m.id)}
                            >
                              <i className="fa-solid fa-arrow-right" aria-hidden />
                            </button>
                            <button
                              type="button"
                              className="mission-action mission-supprimer"
                              aria-label={`${t.missions.supprimer} : ${m.titre}`}
                              title={t.missions.supprimer}
                              onClick={() => supprimer(m.id)}
                            >
                              <i className="fa-solid fa-trash" aria-hidden />
                            </button>
                          </span>
                        </div>
                      </article>
                    ))
                )}
              </div>
            </div>
          ))}
        </section>

        <p className="module-note">{t.missions.note}</p>
      </section>
    </div>
  );
};
