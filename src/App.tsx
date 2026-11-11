import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { PrefsProvider } from './app/prefs';
import { SessionProvider } from './app/session';
import { RoutePrivee } from './app/gardes';
import { AuraIntro, shouldShowIntro } from './components/intro/AuraIntro';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { useRevealGlobal } from './components/motion/useReveal';
import { lazy, Suspense } from 'react';

/** Attente visible pendant le chargement d'un module de page. */
const ChargementPage: React.FC = () => (
  <div className="page-chargement" role="status" aria-live="polite">
    <span className="etat-spinner" aria-hidden />
    <span className="sr-only">Chargement…</span>
  </div>
);

const DocumentationPage = lazy(() =>
  import('./pages/DocumentationPage').then((m) => ({ default: m.DocumentationPage })),
);
const DocumentationArticlePage = lazy(() =>
  import('./pages/DocumentationArticlePage').then((m) => ({ default: m.DocumentationArticlePage })),
);
import { EspacePage } from './pages/EspacePage';
import { ChatPage } from './pages/ChatPage';
import { ExplorePage } from './pages/ExplorePage';
import { StudioPage } from './pages/StudioPage';
import { MissionsPage } from './pages/MissionsPage';
import { HistoriquePage } from './pages/HistoriquePage';
import { ParametresPage } from './pages/ParametresPage';
import { AdminPage } from './pages/AdminPage';
import { ProjetsPage, ProjetDetailPage } from './pages/ProjetsPage';
import { MemoirePage } from './pages/MemoirePage';
import { WorkspaceLayout } from './components/layout/WorkspaceLayout';
import { NotFoundPage } from './pages/NotFoundPage';
import { MotDePasseOubliePage } from './pages/MotDePasseOubliePage';
import { ReinitialiserPage } from './pages/ReinitialiserPage';
import { VerifierEmailPage } from './pages/VerifierEmailPage';

const ScrollToTop: React.FC = () => {
  const location = useLocation();
  React.useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);
  return null;
};

export const App: React.FC = () => {
  useRevealGlobal();
  const [showIntro, setShowIntro] = useState(() => shouldShowIntro());

  return (
    <PrefsProvider>
      <SessionProvider>
        {showIntro && <AuraIntro onDone={() => setShowIntro(false)} />}
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/mot-de-passe-oublie" element={<MotDePasseOubliePage />} />
            <Route path="/reinitialiser" element={<ReinitialiserPage />} />
            <Route path="/verifier-email" element={<VerifierEmailPage />} />
            <Route path="/documentation" element={<Suspense fallback={<ChargementPage />}><DocumentationPage /></Suspense>} />
            <Route path="/documentation/:slug" element={<Suspense fallback={<ChargementPage />}><DocumentationArticlePage /></Suspense>} />
            <Route element={<RoutePrivee />}>
              <Route element={<WorkspaceLayout />}>
                <Route path="/app" element={<EspacePage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/chat/:id" element={<ChatPage />} />
                <Route path="/projets" element={<ProjetsPage />} />
                <Route path="/projets/:id" element={<ProjetDetailPage />} />
                <Route path="/historique" element={<HistoriquePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/studio" element={<StudioPage />} />
                <Route path="/missions" element={<MissionsPage />} />
                <Route path="/memoire" element={<MemoirePage />} />
                <Route path="/parametres" element={<ParametresPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </SessionProvider>
    </PrefsProvider>
  );
};
