import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { AuraLogo } from '../components/brand/AuraLogo';

const MOTS = ['Réfléchir.', 'Rechercher.', 'Créer.', 'Développer.'];

/**
 * Authentification — panneau gauche « film ruban » (boucle de 8 s,
 * façon Claude) et formulaire honnête : la saisie n'est pas envoyée,
 * les comptes ouvrent à la prochaine étape du chantier.
 */
export const AuthPage: React.FC = () => {
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

      // Barrages de lumière
      tl.fromTo(
        '[data-auth-sweep]',
        { xPercent: -160, skewX: -14 },
        { xPercent: 320, skewX: -14, duration: 3.6, ease: 'power2.inOut' },
        0,
      );

      // Mots qui se succèdent (2 s chacun, boucle de 8 s)
      MOTS.forEach((_, i) => {
        tl.to('[data-auth-mot]', { opacity: 0, y: -14, duration: 0.45, ease: 'power2.in' }, i * 2 - 0.01)
          .fromTo(
            `[data-auth-mot="${i}"]`,
            { opacity: 0, y: 26 },
            { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out' },
            i * 2,
          );
      });

      // Cartes flottantes
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
  }, []);

  return (
    <div className="auth">
      {/* ---------- Film ruban (8 s en boucle) ---------- */}
      <aside className="auth-film" ref={filmRef} aria-hidden>
        <div className="auth-balayage" data-auth-sweep />

        <div className="auth-sculpture">
          <img src="/assets/aura-symbol-white.jpg" alt="" />
        </div>

        <div
          className="auth-carte"
          data-auth-carte
          style={{ top: '12%', right: '9%' }}
        >
          <i style={{ background: 'var(--lime)' }} /> Idée reçue
        </div>
        <div
          className="auth-carte"
          data-auth-carte
          style={{ top: '30%', left: '7%' }}
        >
          <i style={{ background: 'var(--or)' }} /> Valeur créée
        </div>
        <div
          className="auth-carte"
          data-auth-carte
          style={{ bottom: '34%', right: '12%' }}
        >
          <i style={{ background: 'var(--feu)' }} /> Livré
        </div>

        <div className="auth-film-texte">
          <div className="auth-mots">
            {MOTS.map((m, i) => (
              <span className="auth-mot" data-auth-mot={i} key={m}>
                {m}
              </span>
            ))}
          </div>
          <p>
            Le fil qui relie votre première phrase au résultat final — avec la
            lumière du logo, sans jamais rompre le geste.
          </p>
        </div>
      </aside>

      {/* ---------- Formulaire ---------- */}
      <main className="auth-formulaire">
        <div className="auth-boite">
          <Link to="/" aria-label="Retour à l'accueil">
            <AuraLogo taille="sm" />
          </Link>
          <h1 className="display-lg">
            Bienvenue <em className="italique-vif">dans Aura</em>.
          </h1>
          <p className="sous-titre">
            L'espace de travail où l'idée devient résultat.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSoumis(true);
            }}
            noValidate
          >
            <div className="form-groupe">
              <label htmlFor="email">Adresse e-mail</label>
              <input
                id="email"
                type="email"
                className="form-champ"
                placeholder="vous@exemple.com"
                autoComplete="email"
              />
            </div>
            <div className="form-groupe">
              <label htmlFor="mdp">Mot de passe</label>
              <input
                id="mdp"
                type="password"
                className="form-champ"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn btn-ruban" style={{ width: '100%', marginTop: '1.6rem' }}>
              <span>Continuer</span>
            </button>
          </form>

          {soumis && (
            <p className="form-note" role="status">
              <strong>Comptes bientôt ouverts.</strong> Le moteur de comptes
              arrive à la prochaine étape du chantier — votre saisie n'est ni
              envoyée, ni enregistrée pour l'instant.
            </p>
          )}

          {!soumis && (
            <p className="form-note">
              Le moteur de comptes se construit actuellement. Aucune donnée
              n'est transmise pour l'instant — la transparence fait partie de
              l'identité d'Aura.
            </p>
          )}

          <Link to="/" className="auth-retour">
            ← Retour à l'accueil
          </Link>
        </div>
      </main>
    </div>
  );
};
