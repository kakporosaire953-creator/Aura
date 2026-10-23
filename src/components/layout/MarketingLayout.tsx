import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AuraLogo } from '../brand/AuraLogo';
import { AuraSignatureFooter } from '../landing/AuraSignatureFooter';
import { useAura } from '../../context/AuraContext';

interface MarketingLayoutProps {
  children: React.ReactNode;
  /** Masque le footer (pages légères, 404…). */
  hideFooter?: boolean;
}

const NAV_LINKS = [
  { to: '/features', label: 'Fonctionnalités' },
  { to: '/pricing', label: 'Tarifs' },
  { to: '/help', label: 'Aide' },
  { to: '/about', label: 'À propos' },
];

export const MarketingLayout: React.FC<MarketingLayoutProps> = ({
  children,
  hideFooter = false,
}) => {
  const { isAuthenticated } = useAura();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#FBFAF5] text-[#14282D] dark:bg-[#0E1618] dark:text-[#F3F2EC]">
      <header className="sticky top-0 z-40 border-b border-[#E8E6DE]/80 bg-[#FBFAF5]/92 backdrop-blur-md dark:border-[#243337] dark:bg-[#0E1618]/92">
        <div className="mx-auto flex h-[62px] max-w-[1160px] items-center justify-between px-4 sm:px-8">
          <Link to="/" className="flex items-center" aria-label="Accueil Aura">
            <AuraLogo size="sm" variant="full" />
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Navigation principale">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-[13px] font-semibold transition-colors ${
                    isActive
                      ? 'text-[#078348] dark:text-[#8CCB4A]'
                      : 'text-[#77817F] hover:text-[#14282D] dark:hover:text-[#F3F2EC]'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/contact"
              className="text-[13px] font-semibold text-[#77817F] transition-colors hover:text-[#14282D] dark:hover:text-[#F3F2EC]"
            >
              Contact
            </Link>
          </nav>

          <div className="hidden items-center gap-2.5 md:flex">
            {isAuthenticated ? (
              <Link
                to="/app"
                className="rounded-full bg-[#078348] px-5 py-2 text-[12.5px] font-semibold text-white shadow-[0_8px_22px_rgba(7,131,72,0.22)] transition-transform hover:-translate-y-[1px]"
              >
                Mon espace
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full border border-[#E8E6DE] px-4.5 py-2 text-[12.5px] font-semibold text-[#14282D] transition-colors hover:border-[#078348] hover:text-[#078348] dark:border-[#243337] dark:text-[#D8D9D2]"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="aura-btn-gradient rounded-full px-5 py-2 text-[12.5px] font-semibold text-white shadow-[0_8px_22px_rgba(7,131,72,0.22)] transition-transform hover:-translate-y-[1px]"
                >
                  Commencer gratuitement
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E8E6DE] text-[#14282D] md:hidden dark:border-[#243337] dark:text-[#F3F2EC]"
            aria-label="Ouvrir le menu"
            aria-expanded={mobileOpen}
          >
            <i className={`fa-solid ${mobileOpen ? 'fa-xmark' : 'fa-bars'}`} />
          </button>
        </div>

        {/* Menu mobile accessible */}
        {mobileOpen && (
          <div className="border-t border-[#E8E6DE] bg-[#FBFAF5] px-4 pb-5 pt-3 md:hidden dark:border-[#243337] dark:bg-[#0E1618]">
            <nav className="flex flex-col gap-1" aria-label="Navigation mobile">
              {[...NAV_LINKS, { to: '/contact', label: 'Contact' }].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-xl px-4 py-2.5 text-[13.5px] font-semibold ${
                    location.pathname === link.to
                      ? 'bg-[#EAF1E8] text-[#078348] dark:bg-[#182E24] dark:text-[#8CCB4A]'
                      : 'text-[#14282D] dark:text-[#F3F2EC]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2">
                {isAuthenticated ? (
                  <Link
                    to="/app"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-full bg-[#078348] px-5 py-2.5 text-center text-[13px] font-semibold text-white"
                  >
                    Mon espace
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-full border border-[#E8E6DE] px-5 py-2.5 text-center text-[13px] font-semibold dark:border-[#243337]"
                    >
                      Connexion
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="aura-btn-gradient rounded-full px-5 py-2.5 text-center text-[13px] font-semibold text-white"
                    >
                      Commencer gratuitement
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>{children}</main>

      {!hideFooter && <AuraSignatureFooter />}
    </div>
  );
};
