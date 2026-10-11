import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuraLogo } from '../brand/AuraLogo';
import { useAura } from '../../context/AuraContext';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  headerActions?: React.ReactNode;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  children,
  headerTitle = 'Accueil',
  headerActions,
}) => {
  const {
    user,
    theme,
    toggleTheme,
    language,
    setLanguage,
    activeProjectId,
    setActiveProjectId,
    conversations,
    projects,
    usage,
    errorBanner,
    clearError,
    logout,
  } = useAura();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [plusModalOpen, setPlusModalOpen] = useState(false);

  const accountMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setAccountMenuOpen(false);
        setNotificationsOpen(false);
        setPlusModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isStudioRoute =
    location.pathname.startsWith('/app/studio') || location.search.includes('studio=1');
  const isNewChatRoute = location.search.includes('new=1');
  const isHomeActive =
    location.pathname === '/app' && !isStudioRoute && !isNewChatRoute;
  const isChatConvActive = location.pathname.startsWith('/app/chat/');
  const isHistoryActive =
    location.pathname.startsWith('/app/library') ||
    location.pathname.startsWith('/app/history');
  const isMissionsActive = location.pathname.startsWith('/app/missions');
  const isProjectsActive = location.pathname.startsWith('/app/projects');
  const isExploreActive = location.pathname.startsWith('/app/explore');
  const isSettingsActive = location.pathname.startsWith('/app/settings');

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const firstName = user.name?.trim().split(' ')[0] || 'Membre';
  const displayEmail = user.email || '';
  const userInitial = (user.name?.trim().charAt(0) || user.email?.trim().charAt(0) || 'A').toUpperCase();

  const navItems = [
    {
      id: 'home',
      path: '/app',
      label: language === 'en' ? 'Home' : 'Accueil',
      icon: 'fa-solid fa-house',
      active: isHomeActive,
    },
    {
      id: 'new-chat',
      path: '/app?new=1',
      label: language === 'en' ? 'New chat' : 'Nouveau chat',
      icon: 'fa-regular fa-comment-dots',
      active: isNewChatRoute || (isChatConvActive && conversations.length === 0),
    },
    {
      id: 'history',
      path: '/app/library',
      label: language === 'en' ? 'Library & History' : 'Bibliothèque',
      icon: 'fa-solid fa-clock-rotate-left',
      active: isHistoryActive,
    },
    {
      id: 'missions',
      path: '/app/missions',
      label: 'Missions',
      icon: 'fa-solid fa-bullseye',
      active: isMissionsActive,
    },
    {
      id: 'studio',
      path: '/app?studio=1',
      label: 'Aura Studio',
      icon: 'fa-solid fa-table-cells-large',
      active: isStudioRoute,
      badge: language === 'en' ? 'Studio' : 'Studio',
    },
    {
      id: 'projects',
      path: '/app/projects',
      label: language === 'en' ? 'Projects' : 'Projets',
      icon: 'fa-regular fa-folder',
      active: isProjectsActive,
    },
    {
      id: 'explore',
      path: '/app/explore',
      label: language === 'en' ? 'Explore' : 'Explorer',
      icon: 'fa-regular fa-compass',
      active: isExploreActive,
    },
  ];

  const renderSidebarContent = (isMobileDrawer = false) => {
    const collapsed = !isMobileDrawer && sidebarCollapsed;

    return (
      <div className="flex flex-col h-full justify-between py-5 px-3.5 select-none overflow-y-auto">
        {/* Top Brand & Primary Navigation */}
        <div className="space-y-5">
          <div className="flex items-center justify-between px-2">
            <Link
              to="/"
              className="focus:outline-none"
              title={language === 'en' ? 'Back to Aura Home' : 'Retour à l’accueil Aura'}
            >
              <AuraLogo size="md" withWordmark={!collapsed} />
            </Link>

            {isMobileDrawer && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg text-[#77817F] hover:text-[#14282D] dark:hover:text-white flex items-center justify-center"
                aria-label="Fermer le menu"
              >
                <i className="fa-solid fa-xmark text-base" />
              </button>
            )}
          </div>

          {/* 7 Primary Nav Links matching Dashboard Reference */}
          <nav className="space-y-1" aria-label="Navigation principale de l’espace de travail">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center ${
                  collapsed ? 'justify-center px-2' : 'justify-between px-3.5'
                } py-2.5 rounded-2xl text-[14px] transition-all duration-150 whitespace-nowrap ${
                  item.active
                    ? 'bg-[#EAF2E2] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] font-semibold'
                    : 'text-[#3D4A47] dark:text-[#94A09E] hover:text-[#14282D] dark:hover:text-[#F3F2EC] hover:bg-[#EFECE2]/75 dark:hover:bg-[#1B292D]/60 font-medium'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <span className="flex items-center gap-3.5 min-w-0">
                  <i
                    className={`${item.icon} text-[15px] w-5 text-center shrink-0 ${
                      item.active
                        ? 'text-[#078348] dark:text-[#8CCB4A]'
                        : 'text-[#3D4A47] dark:text-[#94A09E]'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </span>

                {!collapsed && item.badge && (
                  <span className="text-[11px] font-semibold text-[#078348] dark:text-[#8CCB4A]">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Recent Conversations History directly in Sidebar (when expanded) */}
          {!collapsed && conversations.length > 0 && (
            <div className="pt-2 border-t border-[#EAE6DC]/80 dark:border-[#243337] space-y-1.5">
              <div className="flex items-center justify-between px-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77817F]">
                  {language === 'en' ? 'Recent chats' : 'Historique récent'}
                </span>
                <Link
                  to="/app?new=1"
                  className="text-[11px] font-medium text-[#078348] dark:text-[#8CCB4A] hover:underline"
                  title={language === 'en' ? 'Start new chat' : 'Nouvelle conversation'}
                >
                  + {language === 'en' ? 'New' : 'Nouveau'}
                </Link>
              </div>
              <div className="space-y-0.5 max-h-36 overflow-y-auto pr-0.5">
                {conversations.slice(0, 5).map((conv) => {
                  const isConvSelected = location.pathname === `/app/chat/${conv.id}`;
                  const modeIcon =
                    conv.mode === 'code'
                      ? 'fa-solid fa-code'
                      : conv.mode === 'search'
                      ? 'fa-solid fa-magnifying-glass'
                      : conv.mode === 'create'
                      ? 'fa-solid fa-compass-drafting'
                      : 'fa-regular fa-comment-dots';
                  return (
                    <Link
                      key={conv.id}
                      to={`/app/chat/${conv.id}`}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs transition-colors truncate ${
                        isConvSelected
                          ? 'bg-[#EAF2E2]/85 dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] font-semibold'
                          : 'text-[#5A6562] dark:text-[#94A09E] hover:text-[#14282D] dark:hover:text-[#F3F2EC] hover:bg-[#EFECE2]/65 dark:hover:bg-[#1B292D]/50'
                      }`}
                      title={conv.title}
                    >
                      <i className={`${modeIcon} text-[11px] w-3.5 text-center shrink-0 opacity-80`} />
                      <span className="truncate">{conv.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Project Context Indicator (if selected) */}
          {!collapsed && activeProject && (
            <div className="px-3 py-2.5 rounded-2xl bg-[#F2EFE6] dark:bg-[#1B292D] border border-[#E5E0D2] dark:border-[#243337]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-[#77817F]">
                  {language === 'en' ? 'Active Project' : 'Projet actif'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveProjectId(undefined)}
                  className="text-[11px] text-[#77817F] hover:text-[#14282D] dark:hover:text-white"
                  title="Désactiver le filtre projet"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
              <p className="text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] truncate mt-0.5">
                {activeProject.name}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Section: "Passez à Aura Plus" Card + Paramètres + User Profile Row */}
        <div className="space-y-3 pt-4">
          {!collapsed && (
            <div className="rounded-2xl bg-[#FBF9F2] dark:bg-[#152023] border border-[#EDE7D6] dark:border-[#243337] p-3.5 shadow-[0_2px_10px_rgba(20,40,45,0.02)]">
              <div className="w-7 h-7 rounded-full bg-[#FFF0D6] dark:bg-[#2E2314] text-[#FF790D] flex items-center justify-center mb-2">
                <i className="fa-solid fa-crown text-[11px]" />
              </div>
              <p className="font-display font-bold text-[13px] text-[#14282D] dark:text-[#F3F2EC] leading-snug">
                {language === 'en' ? 'Upgrade to Aura Plus' : 'Passez à Aura Plus'}
              </p>
              <p className="text-[11px] text-[#77817F] dark:text-[#94A09E] mt-0.5 leading-snug">
                {language === 'en'
                  ? 'More power, more possibilities.'
                  : 'Plus de puissance, plus de possibilités.'}
              </p>
              <button
                type="button"
                onClick={() => setPlusModalOpen(true)}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FCE9B5] hover:bg-[#F9DF9B] dark:bg-[#3A2B14] dark:hover:bg-[#4A371A] text-[#B86200] dark:text-[#FBBF24] text-[11px] font-semibold transition-colors cursor-pointer"
              >
                <span>{language === 'en' ? 'Discover' : 'Découvrir'}</span>
                <i className="fa-solid fa-arrow-right text-[9px]" />
              </button>
            </div>
          )}

          {/* Settings Link */}
          <div className="pt-1">
            <Link
              to="/app/settings"
              className={`flex items-center ${
                collapsed ? 'justify-center px-2' : 'gap-3 px-3'
              } py-2 rounded-xl text-[13px] transition-colors ${
                isSettingsActive
                  ? 'bg-[#EAF2E2] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] font-semibold'
                  : 'text-[#3D4A47] dark:text-[#94A09E] hover:text-[#14282D] dark:hover:text-[#F3F2EC] hover:bg-[#EFECE2]/70 dark:hover:bg-[#1B292D]/60 font-medium'
              }`}
              title="Paramètres"
            >
              <i className="fa-solid fa-gear text-[14px] w-5 text-center text-[#5A6562] dark:text-[#94A09E]" />
              {!collapsed && (
                <span>{language === 'en' ? 'Settings' : 'Paramètres'}</span>
              )}
            </Link>
          </div>

          {/* Bottom User Profile Row matching Reference */}
          <div className="pt-2 border-t border-[#E8E4D9] dark:border-[#243337]">
            <button
              type="button"
              onClick={() => navigate('/app/settings')}
              className={`w-full flex items-center ${
                collapsed ? 'justify-center p-1.5' : 'justify-between px-2 py-1.5'
              } rounded-2xl hover:bg-[#EFECE2]/75 dark:hover:bg-[#1B292D] transition-colors text-left cursor-pointer`}
              title="Profil & Compte"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover border border-[#E5E0D2] dark:border-[#243337] shrink-0"
                  />
                ) : (
                  <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2E8B47] to-[#8CCB4A] text-white font-display font-bold text-xs flex items-center justify-center shrink-0">
                    {userInitial}
                  </span>
                )}
                {!collapsed && (
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#14282D] dark:text-[#F3F2EC] truncate leading-tight">
                      {firstName}
                    </p>
                    <p className="text-[11px] text-[#77817F] truncate leading-tight mt-0.5">
                      {displayEmail}
                    </p>
                  </div>
                )}
              </div>
              {!collapsed && (
                <i className="fa-solid fa-chevron-right text-[10px] text-[#77817F] shrink-0 ml-1" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-[#F9F7F0] dark:bg-[#0E1618] text-[#14282D] dark:text-[#F3F2EC]">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 bg-[#F7F4EB] dark:bg-[#0E1618] border-r border-[#EAE6DC] dark:border-[#243337] transition-all duration-200 ${
          sidebarCollapsed ? 'w-18' : 'w-[244px]'
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navigation mobile Aura"
          className="fixed inset-0 z-50 md:hidden flex"
        >
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[84vw] h-full bg-[#F7F4EB] dark:bg-[#0E1618] border-r border-[#EAE6DC] dark:border-[#243337] shadow-2xl">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar matching Dashboard Reference */}
        <header className="h-15 sm:h-16 px-4 sm:px-8 border-b border-[#ECE8DE]/80 dark:border-[#243337] flex items-center justify-between gap-3 shrink-0 bg-[#F9F7F0]/85 dark:bg-[#0E1618]/90 backdrop-blur-md sticky top-0 z-30">
          {/* Left: Mobile Drawer Trigger / Desktop Collapse Toggle + Page Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-9 h-9 rounded-xl border border-[#EAE6DC] dark:border-[#243337] bg-[#FFFDF9] dark:bg-[#152023] flex items-center justify-center text-[#14282D] dark:text-[#F3F2EC]"
              aria-label="Ouvrir le menu de navigation"
            >
              <i className="fa-solid fa-bars text-sm" />
            </button>

            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="hidden md:flex w-7 h-7 rounded-lg text-[#5A6562] hover:text-[#14282D] dark:text-[#94A09E] dark:hover:text-white hover:bg-[#EFECE2] dark:hover:bg-[#1B292D] items-center justify-center transition-colors cursor-pointer"
              title={sidebarCollapsed ? 'Déplier la barre latérale' : 'Réduire la barre latérale'}
              aria-label="Basculer la barre latérale"
            >
              <span className="font-mono text-xs font-bold tracking-tighter leading-none">
                &lt;&gt;
              </span>
            </button>

            <h1 className="font-display font-semibold text-[15px] sm:text-base text-[#14282D] dark:text-[#F3F2EC] truncate">
              {headerTitle}
            </h1>
          </div>

          {/* Right: Optional Header Actions, Theme Icon, "Plan gratuit" Pill, Notification Bell, User Avatar */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            {headerActions}

            {/* Theme Toggle Icon */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#3D4A47] dark:text-[#F3F2EC] hover:bg-[#EFECE2] dark:hover:bg-[#1B292D] transition-colors cursor-pointer"
              aria-label={
                theme === 'light' ? 'Activer le thème sombre' : 'Activer le thème clair'
              }
              title={theme === 'light' ? 'Mode sombre' : 'Mode clair'}
            >
              <i
                className={`fa-regular ${
                  theme === 'light' ? 'fa-sun' : 'fa-moon'
                } text-[16px]`}
              />
            </button>

            {/* "Plan gratuit" Pill matching Dashboard Reference */}
            <Link
              to="/app/usage"
              className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-[#EAF2E2] dark:bg-[#182E24] border border-[#DCE8D0] dark:border-[#244233] text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] hover:border-[#078348]/40 transition-colors whitespace-nowrap"
              title="Voir votre consommation et vos quotas"
            >
              <span className="w-2.5 h-2.5 rounded-full border-[2px] border-[#078348] bg-[#8CCB4A] shrink-0" />
              <span>{language === 'en' ? 'Free plan' : 'Plan gratuit'}</span>
            </Link>

            {/* Notification Bell with Orange Dot */}
            <div className="relative" ref={notifMenuRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-[#3D4A47] dark:text-[#F3F2EC] hover:bg-[#EFECE2] dark:hover:bg-[#1B292D] transition-colors cursor-pointer"
                aria-label="Notifications"
                title="Notifications"
              >
                <i className="fa-regular fa-bell text-[16px]" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF790D] ring-2 ring-[#F9F7F0] dark:ring-[#0E1618]" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] shadow-xl p-3 z-50 space-y-2.5">
                  <div className="flex items-center justify-between px-1 pb-2 border-b border-[#EAE6DC]/70 dark:border-[#243337]">
                    <span className="font-display font-bold text-xs text-[#14282D] dark:text-[#F3F2EC]">
                      Notifications Aura
                    </span>
                    <span className="text-[11px] text-[#078348] dark:text-[#8CCB4A] font-medium">
                      Espace personnel
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FBFAF5] dark:bg-[#1B292D] border border-[#EAE6DC]/70 dark:border-[#243337] text-xs space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                      <span className="w-2 h-2 rounded-full bg-[#078348]" />
                      <span>Bienvenue sur Aura, {firstName}</span>
                    </div>
                    <p className="text-[11px] text-[#77817F] leading-snug">
                      Votre espace de travail est prêt. Vos futures créations et missions sont enregistrées uniquement sur votre compte.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar Dropdown */}
            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 py-1 pl-1 pr-1.5 rounded-full hover:bg-[#EFECE2] dark:hover:bg-[#1B292D] transition-colors cursor-pointer"
                aria-expanded={accountMenuOpen}
                aria-label="Menu du profil"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border border-[#E5E0D2] dark:border-[#243337]"
                  />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2E8B47] to-[#8CCB4A] text-white font-display font-bold text-xs flex items-center justify-center">
                    {userInitial}
                  </span>
                )}
                <i className="fa-solid fa-chevron-down text-[10px] text-[#5A6562] dark:text-[#94A09E]" />
              </button>

              {accountMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] shadow-xl p-2 z-50">
                  <div className="px-3 py-2 border-b border-[#EAE6DC]/60 dark:border-[#243337] mb-1">
                    <p className="text-xs font-bold text-[#14282D] dark:text-[#F3F2EC] truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-[#77817F] truncate">{displayEmail}</p>
                  </div>

                  <Link
                    to="/app/settings"
                    onClick={() => setAccountMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#14282D] dark:text-[#F3F2EC] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] transition-colors"
                  >
                    <i className="fa-regular fa-user w-4 text-center text-[#77817F]" />
                    <span>{language === 'en' ? 'Profile & Settings' : 'Profil & Préférences'}</span>
                  </Link>

                  <Link
                    to="/app/usage"
                    onClick={() => setAccountMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#14282D] dark:text-[#F3F2EC] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] transition-colors"
                  >
                    <i className="fa-solid fa-chart-simple w-4 text-center text-[#77817F]" />
                    <span>
                      {language === 'en' ? 'Usage & Quotas' : 'Utilisation'} (
                      {usage ? `${usage.requestsUsed}/${usage.dailyLimit}` : '0/50'})
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      setLanguage(language === 'fr' ? 'en' : 'fr');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[#14282D] dark:text-[#F3F2EC] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <i className="fa-solid fa-globe w-4 text-center text-[#77817F]" />
                      <span>{language === 'en' ? 'Language' : 'Langue'}</span>
                    </span>
                    <span className="font-mono uppercase text-[11px] text-[#078348] font-bold">
                      {language}
                    </span>
                  </button>

                  <Link
                    to="/"
                    onClick={() => setAccountMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#14282D] dark:text-[#F3F2EC] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] transition-colors"
                  >
                    <i className="fa-solid fa-house w-4 text-center text-[#77817F]" />
                    <span>{language === 'en' ? 'Public Landing Page' : 'Page d’accueil publique'}</span>
                  </Link>

                  <div className="my-1 border-t border-[#EAE6DC]/60 dark:border-[#243337]" />

                  <button
                    type="button"
                    onClick={async () => {
                      setAccountMenuOpen(false);
                      await logout();
                      navigate('/login', { replace: true });
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#DC2626] hover:bg-[#FEE2E2]/50 dark:hover:bg-[#DC2626]/10 transition-colors text-left cursor-pointer"
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center" />
                    <span>{language === 'en' ? 'Sign out' : 'Se déconnecter'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Global Error Banner if any */}
        {errorBanner && (
          <div className="mx-4 sm:mx-8 mt-4 px-4 py-3 rounded-xl bg-[#FEF2F2] dark:bg-[#2C1517] border border-[#FECACA] dark:border-[#5C2327] flex items-center justify-between gap-3 text-xs text-[#991B1B] dark:text-[#FCA5A5]">
            <div className="flex items-center gap-2.5">
              <i className="fa-solid fa-triangle-exclamation text-sm shrink-0" />
              <span>{errorBanner}</span>
            </div>
            <button
              type="button"
              onClick={clearError}
              className="text-xs font-medium underline shrink-0"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Main Workspace Body with subtle route transition */}
        <main key={location.pathname} className="flex-1 flex flex-col min-h-0 aura-route-fade">
          {children}
        </main>
      </div>

      {/* Aura Plus Discovery Modal */}
      {plusModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Découvrir Aura Plus"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs"
          onClick={() => setPlusModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-6 sm:p-7 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-full bg-[#FFF0D6] text-[#FF790D] flex items-center justify-center">
                  <i className="fa-solid fa-crown text-sm" />
                </span>
                <div>
                  <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
                    Aura Plus
                  </h3>
                  <p className="text-xs text-[#77817F]">
                    Plus de puissance, plus de possibilités.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPlusModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-[#F4F2EA] flex items-center justify-center text-[#77817F]"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm text-[#14282D] dark:text-[#F3F2EC] pt-1">
              <li className="flex items-center gap-2.5">
                <i className="fa-solid fa-check text-[#078348] text-xs" />
                <span>Jusqu’à 1 000 requêtes quotidiennes haute vitesse</span>
              </li>
              <li className="flex items-center gap-2.5">
                <i className="fa-solid fa-check text-[#078348] text-xs" />
                <span>Accès complet à Aura Studio, Missions et Recherche Web sourcée</span>
              </li>
              <li className="flex items-center gap-2.5">
                <i className="fa-solid fa-check text-[#078348] text-xs" />
                <span>Sélection multi-modèles (GPT-4o, Gemini 3.8 Flash, Claude 3.7)</span>
              </li>
            </ul>

            <div className="pt-3 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPlusModalOpen(false)}
                className="px-4 py-2 rounded-full border border-[#EAE6DC] dark:border-[#243337] text-xs font-medium text-[#77817F]"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlusModalOpen(false);
                  navigate('/app/usage');
                }}
                className="aura-btn-gradient px-5 py-2 rounded-full text-xs font-semibold text-white cursor-pointer"
              >
                Gérer mon plan & quotas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
