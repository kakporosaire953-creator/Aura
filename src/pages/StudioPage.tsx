import React, { useState } from 'react';
import { SiteNav, SiteFooter } from '../components/layout/SiteChrome';
import { WorkspaceNav } from '../components/layout/WorkspaceNav';
import { useT } from '../app/prefs';
import { simulationActivee } from '../app/simulation';

import imgTelephones from '../assets/galerie/boutique-telephones.jpg';
import imgPhoto from '../assets/galerie/studio-photo.jpg';
import imgChef from '../assets/galerie/chef-cuisinier.jpg';
import imgFintech from '../assets/galerie/fintech-epargne.jpg';
import imgVoyage from '../assets/galerie/voyage-benin.jpg';
import imgFestival from '../assets/galerie/festival-nuit.jpg';

const APERCUS = [imgTelephones, imgPhoto, imgChef, imgFintech, imgVoyage, imgFestival];

/**
 * Studio — interface de génération. Simulation : les aperçus sont des
 * visuels de démonstration badgés ; la génération réelle arrivera avec
 * l'API dédiée.
 */
export const StudioPage: React.FC = () => {
  const t = useT();
  const sim = simulationActivee();
  const [consigne, setConsigne] = useState('');
  const [style, setStyle] = useState(0);
  const [format, setFormat] = useState(0);
  const [etat, setEtat] = useState<'idle' | 'generation' | 'fait'>('idle');
  const [progression, setProgression] = useState(0);

  const generer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consigne.trim() || etat === 'generation') return;
    setEtat('generation');
    setProgression(0);
    // Simulation de la progression — étiquetée, aucun rendu réel.
    const debut = Date.now();
    const minuteur = window.setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - debut) / 2100) * 100));
      setProgression(p);
      if (p >= 100) {
        window.clearInterval(minuteur);
        setEtat('fait');
      }
    }, 90);
  };

  return (
    <div className="module-page">
      <SiteNav />
      <WorkspaceNav />

      <main className="module wrap">
        <header className="module-entete">
          <span className="kicker">{t.studio.kicker}</span>
          <h1 className="display-xl">
            {t.studio.titre1} <em className="italique-vif">{t.studio.titre2}</em>.
          </h1>
          <p className="sous-titre">{t.studio.sous}</p>
        </header>

        <form className="studio-form" onSubmit={generer}>
          <label className="form-groupe" htmlFor="studio-consigne">
            {t.studio.consigneLabel}
          </label>
          <textarea
            id="studio-consigne"
            className="form-champ studio-textarea"
            placeholder={t.studio.placeholder}
            value={consigne}
            onChange={(e) => setConsigne(e.target.value)}
            rows={3}
            maxLength={600}
          />

          <div className="studio-options">
            <div>
              <span className="form-groupe">{t.studio.styleLabel}</span>
              <div className="studio-pastilles" role="group" aria-label={t.studio.styleLabel}>
                {t.studio.styles.map((s, i) => (
                  <button
                    type="button"
                    key={s}
                    className={style === i ? 'actif' : ''}
                    onClick={() => setStyle(i)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="form-groupe">{t.studio.formatLabel}</span>
              <div className="studio-pastilles" role="group" aria-label={t.studio.formatLabel}>
                {t.studio.formats.map((f, i) => (
                  <button
                    type="button"
                    key={f}
                    className={format === i ? 'actif' : ''}
                    onClick={() => setFormat(i)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-ruban" disabled={etat === 'generation'}>
            <i className="fa-solid fa-wand-magic-sparkles" aria-hidden />
            <span>{etat === 'generation' ? t.studio.generation : t.studio.generer}</span>
          </button>
        </form>

        {etat !== 'idle' && (
          <section className="studio-apercus" aria-label={t.studio.apercuTitre}>
            <h2 className="display-md">
              {t.studio.apercuTitre} {sim && <span className="badge-sim">{t.simulation.badge}</span>}
            </h2>
            {etat === 'generation' ? (
              <div className="studio-progression" role="status">
                <div className="studio-progression-barre">
                  <span style={{ width: `${progression}%` }} />
                </div>
                <span>{progression}%</span>
              </div>
            ) : (
              <div className="studio-grille">
                {APERCUS.slice(0, 4).map((img, i) => (
                  <figure className="studio-apercu" key={i}>
                    <img src={img} alt={`${t.studio.apercuTitre} ${i + 1}`} loading="lazy" />
                    <figcaption>
                      {t.studio.badge} · {t.studio.styles[style]} · {t.studio.formats[format]}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </section>
        )}

        <p className="module-note">{t.studio.note}</p>
      </main>

      <SiteFooter />
    </div>
  );
};
