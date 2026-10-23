import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MarketingLayout } from '../../components/layout/MarketingLayout';
import { useAuraMarketingMotion } from '../../components/landing/useAuraMarketingMotion';
import imgAbstract from '../../assets/images/create_preview_abstract_1791622857564.jpg';
import imgProduct from '../../assets/images/aura_showcase_product_1791622893523.jpg';

export const ContactPage: React.FC = () => {
  const scope = useAuraMarketingMotion<HTMLDivElement>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [phase, setPhase] = useState<'form' | 'sending' | 'sent' | 'error'>('form');
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    email.includes('@') && message.trim().length >= 10 && phase !== 'sending';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setPhase('sending');
    setError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Envoi impossible.');
      }
      setPhase('sent');
    } catch (err) {
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  return (
    <MarketingLayout>
      <div ref={scope}>
        <section className="mx-auto max-w-[1160px] px-4 py-16 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr]">
            <div>
              <span
                data-hero-item
                className="inline-flex items-center gap-2 rounded-full border border-[#E8E6DE] bg-[#FFFDF8] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#77817F] dark:border-[#243337] dark:bg-[#152023]"
              >
                <i className="fa-regular fa-envelope text-[#078348]" />
                Contact
              </span>
              <h1
                data-hero-item
                className="mt-5 font-display text-[34px] font-bold leading-[1.1] tracking-[-0.02em] text-[#14282D] sm:text-[44px] dark:text-[#F3F2EC]"
              >
                Parlons de votre projet.
              </h1>
              <p
                data-hero-item
                className="mt-5 max-w-md text-[14.5px] leading-[1.75] text-[#77817F]"
              >
                Une question sur le produit, une demande de fonctionnalité, un sujet
                de collaboration ? Écrivez-nous : votre message est enregistré et
                suivi par l’équipe Aura.
              </p>
              <div data-stagger className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#EAF1E8] text-[#078348] dark:bg-[#182E24] dark:text-[#8CCB4A]">
                  <i className="fa-solid fa-book-open text-[13px]" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                    Besoin d’aide immédiate ?
                  </p>
                  <Link
                    to="/help"
                    className="text-[12.5px] font-semibold text-[#078348] underline-offset-2 hover:underline dark:text-[#8CCB4A]"
                  >
                    Consultez le centre d’aide →
                  </Link>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#FBF3D9] text-[#A16207] dark:bg-[#2A2614] dark:text-[#EACB37]">
                  <i className="fa-solid fa-scale-balanced text-[13px]" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                    Sujets légaux
                  </p>
                  <Link
                    to="/legal/notices"
                    className="text-[12.5px] font-semibold text-[#078348] underline-offset-2 hover:underline dark:text-[#8CCB4A]"
                  >
                    Mentions légales et transparence →
                  </Link>
                </div>
              </div>
            </div>

              {/* Visuel de marque */}
              <div data-reveal className="mt-9 overflow-hidden rounded-[18px] border border-[#E8E6DE] shadow-[0_18px_46px_rgba(20,40,45,0.1)] dark:border-[#243337]">
                <div className="relative h-[190px] overflow-hidden">
                  <img
                    src={imgAbstract}
                    alt="Rubans verts et orange en mouvement, signature visuelle Aura"
                    data-parallax
                    className="h-[118%] w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#14282D]/35 to-transparent" />
                </div>
                <div className="flex items-center gap-3 bg-[#FFFDF8] p-4 dark:bg-[#152023]">
                  <img
                    src={imgProduct}
                    alt="Exemple de création produit avec Aura"
                    className="h-12 w-12 rounded-[10px] object-cover"
                    loading="lazy"
                  />
                  <p className="text-[11.5px] leading-relaxed text-[#77817F]">
                    Une équipe à l’écoute des créateurs, développeurs et entrepreneurs
                    qui construisent avec Aura.
                  </p>
                </div>
              </div>
            </div>

          <div data-hero-item className="rounded-[20px] border border-[#E8E6DE] bg-[#FFFDF8] p-6 shadow-[0_14px_44px_rgba(20,40,45,0.05)] sm:p-8 dark:border-[#243337] dark:bg-[#152023]">
            {phase === 'sent' ? (
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF1E8] dark:bg-[#182E24]">
                  <i className="fa-solid fa-check text-xl text-[#078348] dark:text-[#8CCB4A]" />
                </div>
                <h2 className="font-display text-[19px] font-bold text-[#14282D] dark:text-[#F3F2EC]">
                  Message enregistré
                </h2>
                <p className="max-w-sm text-[13px] leading-relaxed text-[#77817F]">
                  Votre message a bien été transmis à l’équipe Aura. Nous vous
                  répondrons selon les disponibilités du support.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPhase('form');
                    setMessage('');
                  }}
                  className="rounded-full border border-[#E8E6DE] px-5 py-2 text-[12.5px] font-semibold text-[#14282D] dark:border-[#243337] dark:text-[#D8D9D2]"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className="mb-1.5 block text-[11.5px] font-semibold text-[#77817F]">
                      Nom (facultatif)
                    </label>
                    <input
                      id="contact-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-[#E8E6DE] bg-[#FBFAF5] px-3.5 py-2.5 text-[13px] text-[#14282D] outline-none focus:border-[#078348] dark:border-[#243337] dark:bg-[#0E1618] dark:text-[#F3F2EC]"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="mb-1.5 block text-[11.5px] font-semibold text-[#77817F]">
                      E-mail <span className="text-[#C2410C]">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-[#E8E6DE] bg-[#FBFAF5] px-3.5 py-2.5 text-[13px] text-[#14282D] outline-none focus:border-[#078348] dark:border-[#243337] dark:bg-[#0E1618] dark:text-[#F3F2EC]"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="contact-subject" className="mb-1.5 block text-[11.5px] font-semibold text-[#77817F]">
                    Sujet (facultatif)
                  </label>
                  <input
                    id="contact-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-xl border border-[#E8E6DE] bg-[#FBFAF5] px-3.5 py-2.5 text-[13px] text-[#14282D] outline-none focus:border-[#078348] dark:border-[#243337] dark:bg-[#0E1618] dark:text-[#F3F2EC]"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="mb-1.5 block text-[11.5px] font-semibold text-[#77817F]">
                    Message <span className="text-[#C2410C]">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Décrivez votre demande…"
                    className="w-full resize-y rounded-xl border border-[#E8E6DE] bg-[#FBFAF5] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#14282D] outline-none focus:border-[#078348] dark:border-[#243337] dark:bg-[#0E1618] dark:text-[#F3F2EC]"
                  />
                </div>
                {phase === 'error' && error && (
                  <p className="rounded-xl border border-[#F0C9A8] bg-[#FCEBDD] px-4 py-2.5 text-[12px] text-[#C2410C] dark:border-[#4A2B18] dark:bg-[#2B1B12] dark:text-[#FF790D]">
                    <i className="fa-solid fa-triangle-exclamation mr-1.5" />
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="aura-btn-gradient w-full rounded-full px-6 py-3 text-[13px] font-semibold text-white transition-transform hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {phase === 'sending' ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2 text-[11px]" />
                      Envoi en cours…
                    </>
                  ) : (
                    'Envoyer le message'
                  )}
                </button>
                <p className="text-[10.5px] leading-relaxed text-[#9AA5A3]">
                  En envoyant ce formulaire, vous acceptez que vos informations soient
                conservées pour traiter votre demande, conformément à la{' '}
                  <Link to="/legal/privacy" className="underline underline-offset-2">
                    politique de confidentialité
                  </Link>
                  . Aucune adresse de support ni délai de réponse n’est promis tant
                  qu’il n’est pas configuré officiellement.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
      </div>
    </MarketingLayout>
  );
};
