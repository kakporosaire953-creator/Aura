import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { AuraLogo } from '../components/brand/AuraLogo';
import { useT } from '../app/prefs';
import { useSession, appelerAuth } from '../app/session';

/** Traduction des codes d'erreur de l'API en messages locaux (fr/en). */
function messageErreur(
  code: string | undefined,
  secours: string,
  t: ReturnType<typeof useT>,
): string {
  switch (code) {
    case 'identifiants':
      return t.auth.errIdentifiants;
    case 'existe':
      return t.auth.errExiste;
    case 'validation':
      return t.auth.errSaisie;
    case 'stockage-indisponible':
      return t.auth.errStockage;
    case 'limite':
      return t.auth.errLimite;
    case 'reseau':
      return t.auth.errServeur;
    default:
      return secours || t.auth.errServeur;
  }
}

/**
 * Authentification — panneau gauche « film ruban » (boucle de 8 s)
 * et formulaire réellement branché sur /api/auth (sessions serveur,
 * stockage honnête). Inscription sur /register, connexion sur /login.
 */
export const AuthPage: React.FC = () => {
  const t = useT();
  const location = useLocation();
  const navigate = useNavigate();
  const { statut, rafraichir } = useSession();
  const inscription = location.pathname.startsWith('/register');
  const filmRef = useRef<HTMLDivElement | null>(null);

  const [email, setEmail] = useState('');
  const [mdp, setMdp] = useState('');
  const [nom, setNom] = useState('');
  const [etat, setEtat] = useState<'idle' | 'envoi' | 'erreur'>('idle');
  const [erreur, setErreur] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, string> | null>(null);

  // Déjà connecté → espace.
  useEffect(() => {
    if (statut === 'connecte') navigate('/app', { replace: true });
  }, [statut, navigate]);

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

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setEtat('envoi');
    setErreur(null);
    setDetail(null);

    // Validation locale immédiate, puis l'API reste juge.
    if (inscription && mdp.length < 8) {
      setEtat('erreur');
      setDetail({ password: 'court' });
      setErreur(t.auth.errMdp);
      return;
    }

    const res = inscription
      ? await appelerAuth('/auth/register', { email, password: mdp, nom })
      : await appelerAuth('/auth/login', { email, password: mdp });

    if (res.ok) {
      await rafraichir();
      navigate('/app', { replace: true });
      return;
    }
    setEtat('erreur');
    setErreur(messageErreur(res.code, res.erreur ?? '', t));
    setDetail(res.detail ?? null);
  };

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
            {inscription ? t.auth.titre1 : t.auth.titreLogin1}{' '}
            <em className="italique-vif">{inscription ? t.auth.titre2 : t.auth.titreLogin2}</em>.
          </h1>
          <p className="sous-titre">{inscription ? t.auth.sous : t.auth.sousLogin}</p>

          <form onSubmit={soumettre} noValidate>
            {inscription && (
              <div className="form-groupe">
                <label htmlFor="nom">{t.auth.nom}</label>
                <input
                  id="nom"
                  type="text"
                  className="form-champ"
                  placeholder={t.auth.nomPlaceholder}
                  autoComplete="name"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  maxLength={80}
                />
              </div>
            )}
            <div className="form-groupe">
              <label htmlFor="email">{t.auth.email}</label>
              <input
                id="email"
                type="email"
                className="form-champ"
                placeholder="vous@exemple.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={detail?.email ? true : undefined}
              />
            </div>
            <div className="form-groupe">
              <label htmlFor="mdp">{t.auth.mdp}</label>
              <input
                id="mdp"
                type="password"
                className="form-champ"
                placeholder="••••••••"
                autoComplete={inscription ? 'new-password' : 'current-password'}
                required
                minLength={inscription ? 8 : undefined}
                value={mdp}
                onChange={(e) => setMdp(e.target.value)}
                aria-invalid={detail?.password ? true : undefined}
              />
            </div>

            {erreur && (
              <p className="form-erreur" role="alert">
                <i className="fa-solid fa-circle-exclamation" aria-hidden /> {erreur}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-ruban"
              disabled={etat === 'envoi'}
              style={{ width: '100%', marginTop: '1.6rem' }}
            >
              <span>{etat === 'envoi' ? t.auth.submitEnvoi : inscription ? t.auth.submit : t.auth.submitLogin}</span>
            </button>
          </form>

          <p className="form-note" role="status">
            {t.auth.note}
          </p>

          <p className="auth-bascule">
            {inscription ? t.auth.basculeLogin : t.auth.basculeRegister}{' '}
            <Link to={inscription ? '/login' : '/register'}>
              {inscription ? t.auth.lienLogin : t.auth.lienRegister}
            </Link>
          </p>

          <Link to="/" className="auth-retour">
            ← {t.auth.retour}
          </Link>
        </div>
      </main>
    </div>
  );
};
