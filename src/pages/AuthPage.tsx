import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { AuraLogo } from '../components/brand/AuraLogo';
import { useT } from '../app/prefs';
import { useSession, appelerAuth } from '../app/session';
import { ouvrirDemo, simulationDisponible } from '../app/simulation';
import { destinationApresConnexion } from '../app/retour';
import { messageErreur, messageGoogle } from '../app/messages-auth';
import { Icone } from '../components/ui/Icone';

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
  // Destination demandée avant la redirection (jamais une URL externe).
  const depuis = destinationApresConnexion(
    (location.state as { depuis?: string } | null)?.depuis,
  );
  const demoDisponible = simulationDisponible();

  const [email, setEmail] = useState('');
  const [mdp, setMdp] = useState('');
  const [nom, setNom] = useState('');
  const [etat, setEtat] = useState<'idle' | 'envoi' | 'erreur'>('idle');
  // Disponibilité lue sur le serveur : un bouton qui mène à un 503 serait
  // une promesse en l'air. En cas d'échec de lecture, on n'affiche rien.
  const [googleDispo, setGoogleDispo] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, string> | null>(null);

  // Déjà connecté → destination demandée, sinon l'espace.
  useEffect(() => {
    if (statut === 'connecte') navigate(depuis, { replace: true });
  }, [statut, navigate, depuis]);

  useEffect(() => {
    let vivant = true;
    fetch('/api/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { config?: { googleConfiguree?: boolean } } | null) => {
        if (vivant && d?.config?.googleConfiguree === true) setGoogleDispo(true);
      })
      .catch(() => {
        /* pas de bouton plutôt qu'un bouton mort */
      });
    return () => {
      vivant = false;
    };
  }, []);

  // Cause réelle d'un retour Google (le serveur redirige avec un code).
  const codeGoogle = new URLSearchParams(location.search).get('google');

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
      // L'inscription peut réussir alors que le lien n'a pas pu partir :
      // l'écran d'attente doit le dire tout de suite, pas après un clic.
      navigate(depuis, {
        replace: true,
        ...(res.envoiMail ? { state: { envoiMail: res.envoiMail } } : {}),
      });
      return;
    }
    setEtat('erreur');
    setErreur(messageErreur(res.code, res.erreur ?? '', t.auth, res.statut));
    setDetail(res.detail ?? null);
  };

  return (
    <div className="auth">
      <a href="#contenu" className="lien-evitement">
        {t.nav.contenu}
      </a>
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

      <main className="auth-formulaire" id="contenu">
        <div className="auth-boite">
          <Link to="/" aria-label="AURA">
            <AuraLogo taille="sm" />
          </Link>
          <h1 className="display-lg">
            {inscription ? t.auth.titre1 : t.auth.titreLogin1}{' '}
            <em className="italique-vif">{inscription ? t.auth.titre2 : t.auth.titreLogin2}</em>.
          </h1>
          <p className="sous-titre">{inscription ? t.auth.sous : t.auth.sousLogin}</p>

          {(location.state as { expiree?: boolean } | null)?.expiree && (
            <p className="form-note form-info" role="status">
              <Icone nom="circle-info" /> {t.auth.sessionExpiree}
            </p>
          )}

          {(location.state as { info?: string } | null)?.info && (
            <p className="form-note form-info" role="status">
              <Icone nom="circle-info" />{' '}
              {(location.state as { info?: string }).info}
            </p>
          )}

          {codeGoogle && (
            <p className="form-note form-info" role="status">
              <Icone nom="circle-info" /> {messageGoogle(codeGoogle, t.auth)}
            </p>
          )}

          {googleDispo && (
            <>
              <a
                className="btn btn-google"
                href={`/api/auth/google/demarrer?retour=${encodeURIComponent(depuis)}`}
                rel="nofollow"
              >
                <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden focusable="false">
                  <path
                    fill="#4285F4"
                    d="M45.1 24.5c0-1.6-.1-2.8-.4-4.1H24v7.8h12c-.2 2-1.5 5-4.4 7l-.1.3 6.4 4.9.4.1c4-3.7 6.8-9.2 6.8-16z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 46c5.9 0 10.9-1.9 14.5-5.3l-6.9-5.4c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.4-9.1l-.3.1-6.6 5.1-.1.3C8.2 41 15.5 46 24 46z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M11.6 28.4A13.7 13.7 0 0 1 10.8 24c0-1.6.3-3.1.7-4.5l-.1-.3-6.7-5.2-.2.1A22 22 0 0 0 2 24c0 3.5.9 6.9 2.5 9.8l7.1-5.4z"
                  />
                  <path
                    fill="#EA4335"
                    d="M24 10.1c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 3.7 29.9 2 24 2 15.5 2 8.2 6.9 4.5 14.2l7 5.4C13.3 14.3 18.2 10.1 24 10.1z"
                  />
                </svg>
                <span>{t.auth.googleBouton}</span>
              </a>
              <p className="auth-separateur" aria-hidden>
                <span>{t.auth.googleOu}</span>
              </p>
            </>
          )}

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

            {!inscription && (
              <p className="auth-oubli">
                <Link to="/mot-de-passe-oublie">{t.securite.oubliTitre1} {t.securite.oubliTitre2} ?</Link>
              </p>
            )}

            {erreur && (
              <p className="form-erreur" role="alert">
                <Icone nom="circle-exclamation" /> {erreur}
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

          {/* Entrée volontaire en démonstration : outil de développement,
              jamais proposé par une version de production. */}
          {demoDisponible && (
            <button
              type="button"
              className="btn btn-ligne auth-demo"
              onClick={() => {
                if (!ouvrirDemo()) return;
                void rafraichir();
                navigate(depuis, { replace: true });
              }}
            >
              <Icone nom="flask" />
              <span>{t.simulation.demoBtn}</span>
            </button>
          )}

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
