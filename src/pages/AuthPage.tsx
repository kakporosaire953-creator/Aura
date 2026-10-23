import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { AuraLogo } from '../components/brand/AuraLogo';
import { useT } from '../app/prefs';

/**
 * Authentification — panneau gauche « film ruban » (boucle de 8 s)
 * et formulaire honnête : la saisie n'est pas envoyée.
 */
export const AuthPage: React.FC = () => {
  const t = useT();
  const filmRef = useRef<HTMLDivElement | null>(null);
  const [soumis, setSoumis] = useState(false);

  useEffect(() => {
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (reduit) {
        gsap.set('[data-auth-mot]', { opacity: 0 });
        gsap.set('[data-auth-mot]:first-child', { opacity: 1 });
        gsap.set('[data-auth-carte]', { opacity: 1, y: 0 });
        return;
      }

      const tl = gsap.timeline({ repeat: -1 });

      tl.fromTo(
        '[data-auth-sweep]',
        { xPercent: -160, skewX: -14 },
        { xPercent: 320, skewX: -14, duration: 3.6, ease: 'power2.inOut' },
        0,
      );

      for (let i = 0; i < 4; i++) {
        tl.to('[data-auth-mot]', { opacity: 0, y: -14, duration: 0.45, ease: 'power2.in' }, i * 2 - 0.01)
          .fromTo(
            `[data-auth-mot="${i}"]`,
            { opacity: 0, y: 26 },
            { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out' },
            i * 2,
          );
      }

      tl.fromTo(
        '[data-auth-carte]',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.55, ease: 'power3.out' },
        0.4,
      ).to(
        '[data-auth-carte]',
        { y: -12, duration: 3.2, stagger: 0.4, yoyo: true, repeat: 1, ease: 'sine.inOut' },
        1.6,
      );
    }, filmRef);

    return () => ctx.revert();
  }, [t]);

  return (
    <div className="auth">
      <aside className="auth-film" ref={filmRef} aria-hidden>
        <div className="auth-balayage" data-auth-sweep />

        <div className="auth-sculpture">
          <img src="/assets/aura-symbol-white.jpg" alt="" />
        </div>

        <div className="auth-carte" data-auth-carte style={{ top: '12%', right: '9%' }}>
          <i style={{ background: 'var(--lime)' }} /> {t.auth.cartes[0]}
        </div>
        <div className="auth-carte" data-auth-carte style={{ top: '30%', left: '7%' }}>
          <i style={{ background: 'var(--or)' }} /> {t.auth.cartes[1]}
        </div>
        <div className="auth-carte" data-auth-carte style={{ bottom: '34%', right: '12%' }}>
          <i style={{ background: 'var(--feu)' }} /> {t.auth.cartes[2]}
        </div>

        <div className="auth-film-texte">
          <div className="auth-mots">
            {t.auth.mots.map((m, i) => (
              <span className="auth-mot" data-auth-mot={i} key={m}>
                {m}
              </span>
            ))}
          </div>
          <p>{t.auth.film}</p>
        </div>
      </aside>

      <main className="auth-formulaire">
        <div className="auth-boite">
          <Link to="/" aria-label="AURA">
            <AuraLogo taille="sm" />
          </Link>
          <h1 className="display-lg">
            {t.auth.titre1} <em className="italique-vif">{t.auth.titre2}</em>.
          </h1>
          <p className="sous-titre">{t.auth.sous}</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSoumis(true);
            }}
            noValidate
          >
            <div className="form-groupe">
              <label htmlFor="email">{t.auth.email}</label>
              <input
                id="email"
                type="email"
                className="form-champ"
                placeholder="vous@exemple.com"
                autoComplete="email"
              />
            </div>
            <div className="form-groupe">
              <label htmlFor="mdp">{t.auth.mdp}</label>
              <input
                id="mdp"
                type="password"
                className="form-champ"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-ruban"
              style={{ width: '100%', marginTop: '1.6rem' }}
            >
              <span>{t.auth.submit}</span>
            </button>
          </form>

          <p className="form-note" role="status">
            {soumis ? (
              <>
                <strong>{t.auth.noteSoumis}</strong>
              </>
            ) : (
              t.auth.note
            )}
          </p>

          <Link to="/" className="auth-retour">
            ← {t.auth.retour}
          </Link>
        </div>
      </main>
    </div>
  );
};
