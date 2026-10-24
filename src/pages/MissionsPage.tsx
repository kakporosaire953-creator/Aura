import React, { useState } from 'react';
import { useT } from '../app/prefs';
import { MISSIONS_INITIALES, simulationActivee, type MissionSimulee } from '../app/simulation';

/**
 * Missions — tableau de projets. Simulation : les missions sont des
 * données de démonstration locales (le bouton « ajouter » fonctionne
 * vraiment dans la page, sans serveur), clairement badgées.
 */
export const MissionsPage: React.FC = () => {
  const t = useT();
  const sim = simulationActivee();
  const [missions, setMissions] = useState<MissionSimulee[]>(MISSIONS_INITIALES);
  const [nouvelle, setNouvelle] = useState('');

  const ajouter = (e: React.FormEvent) => {
    e.preventDefault();
    const titre = nouvelle.trim();
    if (!titre) return;
    setMissions((m) => [
      { titre, colonne: 0, etiquettes: [t.missions.nouvelleEtiquette], progression: 0 },
      ...m,
    ]);
    setNouvelle('');
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
                      <article className="mission-carte" key={m.titre}>
                        <h3>{m.titre}</h3>
                        <div className="mission-etiquettes">
                          {m.etiquettes.map((e) => (
                            <span key={e}>{e}</span>
                          ))}
                        </div>
                        <div className="mission-progression" aria-hidden>
                          <span style={{ width: `${m.progression}%` }} />
                        </div>
                        <span className="mission-pourcent">{m.progression}%</span>
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
