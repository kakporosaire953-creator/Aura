import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuraLogo } from '../components/brand/AuraLogo';
import { useAura } from '../context/AuraContext';
import authHeroImg from '../assets/images/auth_hero_workspace_1791685458368.jpg';

export const AuthPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    isAuthenticated,
    authenticatedUser,
    login,
    register,
    loginWithOAuth,
    errorBanner,
    clearError,
  } = useAura();

  const initialMode = location.pathname.includes('register')
    ? 'register'
    : location.pathname.includes('forgot')
    ? 'forgot'
    : 'login';

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);
  const [termsConsent, setTermsConsent] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // OAuth Modal State (Google / GitHub real user account input, zero demo prefill)
  const [oauthProvider, setOauthProvider] = useState<'google' | 'github' | null>(null);
  const [oauthName, setOauthName] = useState('');
  const [oauthEmail, setOauthEmail] = useState('');

  useEffect(() => {
    if (location.pathname.includes('register')) {
      setMode('register');
    } else if (location.pathname.includes('forgot')) {
      setMode('forgot');
    } else {
      setMode('login');
    }
    clearError();
    setLocalError(null);
  }, [location.pathname, clearError]);

  // Redirect already authenticated user appropriately
  useEffect(() => {
    if (isAuthenticated && authenticatedUser) {
      if (!authenticatedUser.onboardingCompleted) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/app', { replace: true });
      }
    }
  }, [isAuthenticated, authenticatedUser, navigate]);

  const switchMode = (nextMode: 'login' | 'register' | 'forgot') => {
    clearError();
    setLocalError(null);
    setStatusMessage(null);
    setMode(nextMode);
  };

  const handleOAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oauthProvider) return;
    clearError();
    setLocalError(null);

    const trimmedName = oauthName.trim();
    const trimmedEmail = oauthEmail.trim();
    if (!trimmedName || !trimmedEmail || !trimmedEmail.includes('@')) {
      setLocalError('Veuillez renseigner votre nom et une adresse e-mail valide.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await loginWithOAuth({
        provider: oauthProvider,
        name: trimmedName,
        email: trimmedEmail,
      });
      if (result.ok && result.user) {
        setOauthProvider(null);
        if (result.isNewUser || !result.user.onboardingCompleted) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/app', { replace: true });
        }
      } else if (result.error) {
        setLocalError(result.error);
      }
    } catch {
      setLocalError('Connexion momentanément indisponible. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);
    setStatusMessage(null);

    const trimmedEmail = email.trim();
    const trimmedPassword = password;
    const trimmedName = name.trim();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setLocalError('Veuillez saisir une adresse e-mail valide.');
      return;
    }

    if (mode === 'register') {
      if (!trimmedName) {
        setLocalError('Veuillez renseigner votre prénom ou nom complet.');
        return;
      }
      if (!trimmedPassword || trimmedPassword.length < 8) {
        setLocalError('Votre mot de passe doit contenir au moins 8 caractères.');
        return;
      }
    } else if (mode === 'login') {
      if (!trimmedPassword) {
        setLocalError('Veuillez saisir votre mot de passe.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        const result = await login(trimmedEmail, trimmedPassword);
        if (result.ok && result.user) {
          if (!result.user.onboardingCompleted) {
            navigate('/onboarding', { replace: true });
          } else {
            navigate('/app', { replace: true });
          }
        } else if (result.error) {
          setLocalError(result.error);
        }
      } else if (mode === 'register') {
        if (!termsConsent) {
          setLocalError('Vous devez accepter les conditions d’utilisation et la politique de confidentialité pour créer un compte.');
          return;
        }
        const result = await register(trimmedName, trimmedEmail, trimmedPassword, {
          termsConsent,
          marketingConsent,
        });
        if (result.ok && result.user) {
          navigate('/onboarding', { replace: true });
        } else if (result.error) {
          setLocalError(result.error);
        }
      } else {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatusMessage(
            data.message ||
              'Un lien de réinitialisation a été envoyé à votre adresse e-mail.'
          );
        } else {
          setLocalError(data.error || 'Impossible d’envoyer le lien.');
        }
      }
    } catch {
      setLocalError(
        'Le serveur Aura est momentanément injoignable. Veuillez réessayer.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const activeError = localError || errorBanner;

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-[#FAF8F2] dark:bg-[#0E1618] text-[#14282D] dark:text-[#F3F2EC] overflow-x-hidden">
      {/* =====================================================================
          LEFT COLUMN: GOLDEN-HOUR WORKSPACE HERO (55% / 7 cols on Desktop)
          Exact match to Image 2 Left Panel
      ===================================================================== */}
      <div className="lg:col-span-7 relative min-h-[360px] sm:min-h-[440px] lg:min-h-screen overflow-hidden flex flex-col justify-between p-6 sm:p-10 xl:p-14 select-none">
        {/* Full-bleed Workspace Sunset Background Image */}
        <img
          src={authHeroImg}
          alt="Espace de création Aura au coucher du soleil"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-bottom scale-[1.02]"
        />

        {/* Luminous Golden-Ivory Sky Scrim in the upper half so the dark typography matches Image 2 */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 90% 60% at 38% 18%, rgba(251,249,241,0.92) 0%, rgba(251,249,241,0.78) 46%, rgba(251,249,241,0.18) 78%, transparent 100%), linear-gradient(180deg, rgba(251,249,241,0.65) 0%, rgba(251,249,241,0.2) 52%, rgba(10,22,18,0.52) 100%)',
          }}
        />

        {/* Top-Left Brand Logo + Headline Block */}
        <div className="relative z-10">
          {/* Official Aura Logo */}
          <Link to="/" className="inline-flex focus:outline-none">
            <AuraLogo size="md" withWordmark />
          </Link>

          {/* Editorial Headline Block positioned in the upper sky area */}
          <div className="mt-6 sm:mt-10 lg:mt-12 lg:ml-20 xl:ml-28 max-w-[490px]">
            <p className="text-[10.5px] sm:text-xs font-bold uppercase tracking-[0.24em] text-[#1E4D32]">
              TON ESPACE IA, TA VISION
            </p>

            <h1 className="font-display font-extrabold text-[30px] sm:text-[40px] xl:text-[46px] leading-[1.08] tracking-tight text-[#14282D] mt-2">
              <span className="block">Des idées plus claires,</span>
              <span className="block mt-0.5">
                des projets{' '}
                <span className="bg-gradient-to-r from-[#5AB946] via-[#CEB722] to-[#FF790D] bg-clip-text text-transparent">
                  plus grands.
                </span>
              </span>
            </h1>

            <p className="mt-3.5 text-xs sm:text-[14.5px] leading-relaxed text-[#384946] max-w-[395px] font-medium">
              Rejoins une communauté de créateurs, d’apprenants et d’innovateurs qui
              transforment leurs idées en réalité avec Aura.
            </p>
          </div>
        </div>

        {/* Bottom-Left Handwritten White Motto over the Foreground Leaves */}
        <div className="relative z-10 mt-8 pt-4 pl-1 sm:pl-2">
          <div className="-rotate-6 inline-block">
            <p
              className="text-white text-xl sm:text-[26px] leading-[1.12] drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
              style={{ fontFamily: 'cursive, "Comic Sans MS", sans-serif', fontStyle: 'italic' }}
            >
              De l’idée
              <br />
              <span className="ml-4">au résultat.</span>
            </p>
            <svg viewBox="0 0 110 14" fill="none" className="w-24 sm:w-28 h-3.5 mt-1 ml-4">
              <path
                d="M4 11 C 38 7, 74 4, 106 3"
                stroke="#F5A623"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* =====================================================================
          RIGHT COLUMN: AUTHENTICATION FORM PANEL (45% / 5 cols on Desktop)
          Exact match to Image 2 Right Panel
      ===================================================================== */}
      <div className="lg:col-span-5 relative flex flex-col justify-between px-6 sm:px-10 xl:px-14 py-7 sm:py-10 bg-[#FAF8F2] dark:bg-[#0E1618] overflow-hidden">
        {/* Decorative Flowing Ribbons on Top-Right & Bottom-Right */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-0 overflow-hidden z-0"
        >
          {/* Top-Right Ribbon */}
          <svg
            viewBox="0 0 240 240"
            fill="none"
            className="absolute -top-6 -right-6 w-[150px] sm:w-[210px] h-auto opacity-95 dark:opacity-40"
          >
            <defs>
              <linearGradient id="auth-tr-ribbon" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3AA346" stopOpacity="0.88" />
                <stop offset="55%" stopColor="#A6DC54" stopOpacity="0.78" />
                <stop offset="100%" stopColor="#FF961F" stopOpacity="0.82" />
              </linearGradient>
            </defs>
            <path
              d="M70 -10 C 115 65, 165 135, 250 190 L 250 -10 Z"
              fill="url(#auth-tr-ribbon)"
            />
            <path
              d="M90 -10 C 130 60, 175 120, 245 165"
              stroke="#FFFDF9"
              strokeWidth="1.5"
              strokeOpacity="0.65"
            />
          </svg>

          {/* Bottom-Right Ribbon */}
          <svg
            viewBox="0 0 260 280"
            fill="none"
            className="absolute -bottom-8 -right-8 w-[170px] sm:w-[230px] h-auto opacity-95 dark:opacity-40"
          >
            <defs>
              <linearGradient id="auth-br-ribbon" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FF8516" stopOpacity="0.88" />
                <stop offset="50%" stopColor="#EAC645" stopOpacity="0.72" />
                <stop offset="100%" stopColor="#4CB648" stopOpacity="0.85" />
              </linearGradient>
            </defs>
            <path
              d="M260 60 C 195 135, 145 205, 85 290 L 260 290 Z"
              fill="url(#auth-br-ribbon)"
            />
            <path
              d="M255 95 C 195 160, 150 220, 105 285"
              stroke="#FFFDF9"
              strokeWidth="1.5"
              strokeOpacity="0.7"
            />
          </svg>
        </div>

        {/* Top-Right Switch Link: "Vous n'avez pas de compte ? Créer un compte ->" */}
        <div className="relative z-10 flex items-center justify-end pr-8 sm:pr-14 text-xs">
          {mode === 'login' ? (
            <div className="flex items-center gap-2 text-[#5A6562] dark:text-[#94A09E]">
              <span>Vous n’avez pas de compte ?</span>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="font-bold text-[#1E7E3E] dark:text-[#8CCB4A] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Créer un compte</span>
                <i className="fa-solid fa-arrow-right text-[10px]" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#5A6562] dark:text-[#94A09E]">
              <span>Vous avez déjà un compte ?</span>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="font-bold text-[#1E7E3E] dark:text-[#8CCB4A] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Se connecter</span>
                <i className="fa-solid fa-arrow-right text-[10px]" />
              </button>
            </div>
          )}
        </div>

        {/* Center Form Container */}
        <div className="relative z-10 my-auto max-w-[390px] w-full mx-auto py-6">
          {/* Centered Brand Logo & Greeting */}
          <div className="flex flex-col items-center text-center mb-7">
            <AuraLogo size="lg" withWordmark className="mb-4" />

            <h2 className="font-display font-extrabold text-[28px] sm:text-[32px] text-[#14282D] dark:text-[#F3F2EC] tracking-tight">
              {mode === 'login'
                ? 'Bienvenue !'
                : mode === 'register'
                ? 'Créer un compte'
                : 'Mot de passe oublié'}
            </h2>
            <p className="mt-1.5 text-xs sm:text-[13.5px] text-[#5C6664] dark:text-[#94A09E]">
              {mode === 'login'
                ? 'Connecte-toi pour continuer sur Aura.'
                : mode === 'register'
                ? 'Inscris-toi pour personnaliser ton espace Aura.'
                : 'Saisis ton adresse e-mail pour réinitialiser ton accès.'}
            </p>
          </div>

          {/* OAuth Buttons (Google & GitHub) */}
          {mode !== 'forgot' && (
            <>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    clearError();
                    setLocalError(null);
                    setOauthProvider('google');
                  }}
                  className="w-full rounded-full bg-[#FFFDF9] dark:bg-[#152023] hover:bg-[#F4F1E8] dark:hover:bg-[#1B292D] border border-[#E6E2D6] dark:border-[#243337] px-5 py-3 shadow-[0_2px_10px_rgba(20,40,45,0.03)] flex items-center justify-between transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                      />
                    </svg>
                    <span className="text-xs sm:text-[13.5px] font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                      Continuer avec Google
                    </span>
                  </div>
                  <i className="fa-solid fa-arrow-right text-xs text-[#3D4A47] dark:text-[#94A09E]" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    clearError();
                    setLocalError(null);
                    setOauthProvider('github');
                  }}
                  className="w-full rounded-full bg-[#FFFDF9] dark:bg-[#152023] hover:bg-[#F4F1E8] dark:hover:bg-[#1B292D] border border-[#E6E2D6] dark:border-[#243337] px-5 py-3 shadow-[0_2px_10px_rgba(20,40,45,0.03)] flex items-center justify-between transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <i className="fa-brands fa-github text-base text-[#14282D] dark:text-white shrink-0" />
                    <span className="text-xs sm:text-[13.5px] font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                      Continuer avec GitHub
                    </span>
                  </div>
                  <i className="fa-solid fa-arrow-right text-xs text-[#3D4A47] dark:text-[#94A09E]" />
                </button>
              </div>

              {/* Divider "OU" */}
              <div className="my-6 flex items-center gap-4">
                <div className="flex-1 h-[1px] bg-[#E5E0D3] dark:bg-[#243337]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#626C6A] dark:text-[#94A09E]">
                  OU
                </span>
                <div className="flex-1 h-[1px] bg-[#E5E0D3] dark:bg-[#243337]" />
              </div>
            </>
          )}

          {/* Error / Status Banners */}
          {activeError && (
            <div className="mb-4 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] flex items-start gap-2">
              <i className="fa-solid fa-circle-exclamation mt-0.5 shrink-0" />
              <span>{activeError}</span>
            </div>
          )}

          {statusMessage && (
            <div className="mb-4 p-3 rounded-xl bg-[#EAF5E4] border border-[#2E8B47]/30 text-xs text-[#1E6A31]">
              {statusMessage}
            </div>
          )}

          {/* Email & Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-[#14282D] dark:text-[#F3F2EC] mb-1.5">
                  Prénom ou nom
                </label>
                <div className="flex items-center gap-3 rounded-2xl bg-[#FBF9F4] dark:bg-[#141F22] border border-[#E2DDD0] dark:border-[#243337] focus-within:border-[#2E8B47] px-4 py-3 transition-colors">
                  <i className="fa-regular fa-user text-xs text-[#6E7775]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ton prénom ou nom"
                    className="flex-1 bg-transparent text-xs sm:text-[13.5px] text-[#14282D] dark:text-[#F3F2EC] placeholder:text-[#9A9E98] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#14282D] dark:text-[#F3F2EC] mb-1.5">
                Adresse e-mail
              </label>
              <div className="flex items-center gap-3 rounded-2xl bg-[#FBF9F4] dark:bg-[#141F22] border border-[#E2DDD0] dark:border-[#243337] focus-within:border-[#2E8B47] px-4 py-3 transition-colors">
                <i className="fa-regular fa-envelope text-xs text-[#6E7775]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  className="flex-1 bg-transparent text-xs sm:text-[13.5px] text-[#14282D] dark:text-[#F3F2EC] placeholder:text-[#9A9E98] focus:outline-none"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-xs font-bold text-[#14282D] dark:text-[#F3F2EC] mb-1.5">
                  Mot de passe
                </label>
                <div className="flex items-center gap-3 rounded-2xl bg-[#FBF9F4] dark:bg-[#141F22] border border-[#E2DDD0] dark:border-[#243337] focus-within:border-[#2E8B47] px-4 py-3 transition-colors">
                  <i className="fa-solid fa-lock text-xs text-[#6E7775]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={mode === 'register' ? 8 : 1}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8 caractères minimum"
                    className="flex-1 bg-transparent text-xs sm:text-[13.5px] text-[#14282D] dark:text-[#F3F2EC] placeholder:text-[#9A9E98] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                    }
                    className="text-[#6E7775] hover:text-[#14282D] dark:hover:text-white cursor-pointer"
                  >
                    <i
                      className={`fa-regular ${
                        showPassword ? 'fa-eye-slash' : 'fa-eye'
                      } text-xs`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Explicit Consents on Registration */}
            {mode === 'register' && (
              <div className="space-y-2.5 pt-1 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer text-[#5A6562] dark:text-[#94A09E] select-none">
                  <input
                    type="checkbox"
                    checked={termsConsent}
                    onChange={(e) => setTermsConsent(e.target.checked)}
                    className="mt-0.5 rounded border-[#D8D3C5] dark:border-[#243337] text-[#078348] focus:ring-[#078348] shrink-0"
                    required
                  />
                  <span className="leading-tight">
                    J’accepte les{' '}
                    <Link
                      to="/legal/terms"
                      target="_blank"
                      className="font-semibold text-[#078348] dark:text-[#8CCB4A] underline hover:text-[#14282D]"
                    >
                      Conditions d’utilisation
                    </Link>{' '}
                    et la{' '}
                    <Link
                      to="/legal/privacy"
                      target="_blank"
                      className="font-semibold text-[#078348] dark:text-[#8CCB4A] underline hover:text-[#14282D]"
                    >
                      Politique de confidentialité
                    </Link>{' '}
                    d’Aura (obligatoire).
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-[#77817F] dark:text-[#7A8885] select-none">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-0.5 rounded border-[#D8D3C5] dark:border-[#243337] text-[#078348] focus:ring-[#078348] shrink-0"
                  />
                  <span className="leading-tight">
                    J’accepte de recevoir des communications relatives aux mises à jour et nouveautés d’Aura (facultatif).
                  </span>
                </label>
              </div>
            )}

            {/* Primary Orange Gradient Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#FF5E00] via-[#FF7A14] to-[#FFA02B] hover:brightness-105 text-white text-xs sm:text-[14px] font-semibold inline-flex items-center justify-center gap-2 shadow-[0_10px_24px_rgba(255,115,15,0.32)] transition-all cursor-pointer disabled:opacity-60"
              >
                <span>
                  {submitting
                    ? 'Traitement...'
                    : mode === 'login'
                    ? 'Se connecter'
                    : mode === 'register'
                    ? 'Créer mon compte'
                    : 'Envoyer le lien'}
                </span>
                <i className="fa-solid fa-arrow-right text-xs" />
              </button>
            </div>
          </form>

          {/* Forgot Password Link below button */}
          <div className="mt-4 text-center">
            {mode !== 'forgot' ? (
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-xs font-bold text-[#1E7E3E] dark:text-[#8CCB4A] hover:underline cursor-pointer"
              >
                Mot de passe oublié ?
              </button>
            ) : (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-xs font-bold text-[#1E7E3E] dark:text-[#8CCB4A] hover:underline cursor-pointer"
              >
                Retour à la connexion
              </button>
            )}
          </div>
        </div>

        {/* Bottom Legal Notice */}
        <div className="relative z-10 text-center text-[11px] text-[#77817F] dark:text-[#94A09E] leading-relaxed max-w-[360px] mx-auto">
          <p>
            En continuant, tu acceptes nos{' '}
            <button
              type="button"
              onClick={() => setLegalModal('terms')}
              className="underline text-[#1E7E3E] dark:text-[#8CCB4A] hover:text-[#14282D] cursor-pointer"
            >
              Conditions d’utilisation
            </button>{' '}
            et notre{' '}
            <button
              type="button"
              onClick={() => setLegalModal('privacy')}
              className="underline text-[#1E7E3E] dark:text-[#8CCB4A] hover:text-[#14282D] cursor-pointer"
            >
              Politique de confidentialité
            </button>
            .
          </p>
        </div>
      </div>

      {/* OAuth Account Connection Modal (Google / GitHub) */}
      {oauthProvider && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#14282D]/45 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setOauthProvider(null)}
        >
          <div
            className="max-w-md w-full rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#E6E2D6] dark:border-[#243337] p-6 sm:p-7 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {oauthProvider === 'google' ? (
                  <span className="w-9 h-9 rounded-full bg-[#F4F1E8] flex items-center justify-center">
                    <i className="fa-brands fa-google text-sm text-[#EA4335]" />
                  </span>
                ) : (
                  <span className="w-9 h-9 rounded-full bg-[#F4F1E8] flex items-center justify-center">
                    <i className="fa-brands fa-github text-base text-[#14282D]" />
                  </span>
                )}
                <div>
                  <h3 className="font-display font-bold text-base text-[#14282D] dark:text-[#F3F2EC]">
                    Continuer avec {oauthProvider === 'google' ? 'Google' : 'GitHub'}
                  </h3>
                  <p className="text-xs text-[#6E7775]">
                    Renseignez votre compte {oauthProvider === 'google' ? 'Google' : 'GitHub'}{' '}
                    pour ouvrir votre session Aura.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOauthProvider(null)}
                className="w-8 h-8 rounded-full hover:bg-[#F2EFE6] flex items-center justify-center text-[#5C6664] cursor-pointer"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <form onSubmit={handleOAuthSubmit} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-[#14282D] dark:text-[#F3F2EC] mb-1.5">
                  Votre nom complet
                </label>
                <input
                  type="text"
                  required
                  value={oauthName}
                  onChange={(e) => setOauthName(e.target.value)}
                  placeholder="Ex : Amina Diallo"
                  className="w-full rounded-2xl bg-[#FBF9F4] dark:bg-[#141F22] border border-[#E2DDD0] dark:border-[#243337] px-4 py-2.5 text-xs sm:text-sm text-[#14282D] dark:text-[#F3F2EC] focus:outline-none focus:border-[#2E8B47]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#14282D] dark:text-[#F3F2EC] mb-1.5">
                  Adresse e-mail {oauthProvider === 'google' ? 'Google' : 'GitHub'}
                </label>
                <input
                  type="email"
                  required
                  value={oauthEmail}
                  onChange={(e) => setOauthEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  className="w-full rounded-2xl bg-[#FBF9F4] dark:bg-[#141F22] border border-[#E2DDD0] dark:border-[#243337] px-4 py-2.5 text-xs sm:text-sm text-[#14282D] dark:text-[#F3F2EC] focus:outline-none focus:border-[#2E8B47]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setOauthProvider(null)}
                  className="px-4 py-2.5 rounded-full border border-[#E2DDD0] text-xs font-semibold text-[#5C6664] cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF5E00] via-[#FF7A14] to-[#FFA02B] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Continuer</span>
                  <i className="fa-solid fa-arrow-right text-[10px]" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Legal Modal if clicked */}
      {legalModal && (
        <div
          className="fixed inset-0 z-50 bg-[#14282D]/45 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLegalModal(null)}
        >
          <div
            className="max-w-md w-full rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#E6E2D6] dark:border-[#243337] p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
                {legalModal === 'terms'
                  ? 'Conditions d’utilisation'
                  : 'Politique de confidentialité'}
              </h3>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="w-8 h-8 rounded-full hover:bg-[#F2EFE6] flex items-center justify-center text-[#5C6664] cursor-pointer"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <p className="text-xs text-[#5C6664] dark:text-[#94A09E] leading-relaxed">
              {legalModal === 'terms'
                ? 'Aura met à votre disposition un espace de travail IA tout-en-un. Vous conservez l’intégralité des droits sur vos créations, textes, recherches et codes générés.'
                : 'Vos conversations, préférences et projets sont protégés et strictement isolés par compte utilisateur. Vous pouvez exporter ou supprimer vos données à tout moment depuis vos Paramètres.'}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="px-5 py-2 rounded-full bg-[#2E8B47] text-white text-xs font-semibold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
