import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuraProvider, useAura } from './context/AuraContext';
import { AuraIntelligenceCore } from './components/brand/AuraIntelligenceCore';
import { AuraIntroLoader, shouldShowIntro } from './components/brand/AuraIntroLoader';
import { LandingPage } from './pages/LandingPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { LibraryPage } from './pages/LibraryPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ExplorePage } from './pages/ExplorePage';
import { UsagePage } from './pages/UsagePage';
import { SettingsPage } from './pages/SettingsPage';
import { MissionsPage } from './pages/MissionsPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { StudioGalleryPage } from './pages/studio/StudioGalleryPage';
import { StudioNewPage } from './pages/studio/StudioNewPage';
import { StudioPreviewPage } from './pages/studio/StudioPreviewPage';

// Developer Mode (éditeur CodeMirror) chargé à la demande — bundle initial allégé
const StudioDevelopPage = lazy(() =>
  import('./pages/studio/StudioDevelopPage').then((m) => ({ default: m.StudioDevelopPage }))
);
import { PricingPage } from './pages/PricingPage';
import { HelpPage } from './pages/HelpPage';
import { TermsPage } from './pages/legal/TermsPage';
import { PrivacyPage } from './pages/legal/PrivacyPage';
import { AcceptableUsePage } from './pages/legal/AcceptableUsePage';
import { CookiesPage } from './pages/legal/CookiesPage';
import { AiTransparencyPage } from './pages/legal/AiTransparencyPage';
import { BillingTermsPage } from './pages/legal/BillingTermsPage';
import { IpPolicyPage } from './pages/legal/IpPolicyPage';
import { LegalNoticePage } from './pages/legal/LegalNoticePage';
import { LegalContactPage } from './pages/legal/LegalContactPage';
import { FeaturesPage } from './pages/marketing/FeaturesPage';
import { FeatureModulePage } from './pages/marketing/FeatureModulePage';
import { AboutPage } from './pages/marketing/AboutPage';
import { ContactPage } from './pages/marketing/ContactPage';
import { NotFoundPage } from './pages/marketing/NotFoundPage';

const SessionCheckFallback: React.FC = () => (
  <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FBFAF5] dark:bg-[#0E1618] text-[#14282D] dark:text-[#F3F2EC]">
    <AuraIntelligenceCore variant="workspace" customLabel="Chargement de votre espace Aura..." />
  </div>
);

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, authenticatedUser, isLoadingInitial } = useAura();
  const location = useLocation();

  if (isLoadingInitial) {
    return <SessionCheckFallback />;
  }

  if (!isAuthenticated || !authenticatedUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If the authenticated user hasn't finished onboarding yet, send them to /onboarding
  if (!authenticatedUser.onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

const RequireAuthForOnboarding: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, authenticatedUser, isLoadingInitial } = useAura();

  if (isLoadingInitial) {
    return <SessionCheckFallback />;
  }

  if (!isAuthenticated || !authenticatedUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  const [showIntro] = React.useState(() => shouldShowIntro());

  return (
    <AuraProvider>
      {showIntro && <AuraIntroLoader />}
      <BrowserRouter>
        <Routes>
          {/* Landing Page Publique */}
          <Route path="/" element={<LandingPage />} />

          {/* Authentification & Onboarding */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/forgot-password" element={<AuthPage />} />
          <Route path="/reset-password" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthPage />} />
          <Route
            path="/onboarding"
            element={
              <RequireAuthForOnboarding>
                <OnboardingPage />
              </RequireAuthForOnboarding>
            }
          />

          {/* Application IA & Espace de Travail Aura (Strictement protégé par session authentifiée) */}
          <Route
            path="/app"
            element={
              <RequireAuth>
                <WorkspacePage />
              </RequireAuth>
            }
          />
          <Route
            path="/app/chat/:conversationId"
            element={
              <RequireAuth>
                <WorkspacePage />
              </RequireAuth>
            }
          />
          <Route
            path="/app/history"
            element={
              <RequireAuth>
                <LibraryPage />
              </RequireAuth>
            }
          />
          <Route
            path="/app/library"
            element={
              <RequireAuth>
                <LibraryPage />
              </RequireAuth>
            }
          />
          <Route
            path="/app/missions"
            element={
              <RequireAuth>
                <MissionsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/app/studio"
            element={
              <RequireAuth>
                <StudioGalleryPage />
              </RequireAuth>
            }
          />
          <Route
            path="/app/studio/new"
            element={
              <RequireAuth>
                <StudioNewPage />
              </RequireAuth>
            }
          />
          <Route
            path="/app/studio/:projectId"
            element={
              <RequireAuth>
                <StudioPreviewPage />
              </RequireAuth>
            }
          />
          <Route
            path="/app/studio/:projectId/preview"
            element={
              <RequireAuth>
                <StudioPreviewPage />
              </RequireAuth>
            }
          />
          <Route
            path="/app/studio/:projectId/develop"
            element={
              <RequireAuth>
                <Suspense
                  fallback={
                    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F8F6EF] dark:bg-[#0E1618]">
                      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#E8E6DE] border-t-[#078348]" />
                      <p className="text-[12px] text-[#77817F]">
                        Chargement du Developer Mode…
                      </p>
                    </div>
                  }
                >
                  <StudioDevelopPage />
                </Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="/app/projects"
            element={
              <RequireAuth>
                <ProjectsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/app/explore"
            element={
              <RequireAuth>
                <ExplorePage />
              </RequireAuth>
            }
          />
          <Route
            path="/app/usage"
            element={
              <RequireAuth>
                <UsagePage />
              </RequireAuth>
            }
          />
          {/* Page Publique des Offres & Quotas */}
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/tarifs" element={<PricingPage />} />
          <Route path="/tarif" element={<PricingPage />} />
          <Route path="/prices" element={<PricingPage />} />

          {/* Paramètres & Préférences (Strictement protégés) */}
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <SettingsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/app/settings"
            element={
              <RequireAuth>
                <SettingsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/app/settings/:tab"
            element={
              <RequireAuth>
                <SettingsPage />
              </RequireAuth>
            }
          />

          {/* Redirections Paramètres & Facturation */}
          <Route
            path="/settings/usage"
            element={
              <RequireAuth>
                <UsagePage />
              </RequireAuth>
            }
          />
          <Route
            path="/settings/billing"
            element={
              <RequireAuth>
                <UsagePage />
              </RequireAuth>
            }
          />
          <Route
            path="/app/billing"
            element={
              <RequireAuth>
                <UsagePage />
              </RequireAuth>
            }
          />

          {/* Centre d'Aide Public */}
          <Route path="/help" element={<HelpPage />} />

          {/* Pages produit publiques */}
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/features/:moduleKey" element={<FeatureModulePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Pages Juridiques Publiques */}
          <Route path="/legal/terms" element={<TermsPage />} />
          <Route path="/legal/privacy" element={<PrivacyPage />} />
          <Route path="/legal/acceptable-use" element={<AcceptableUsePage />} />
          <Route path="/legal/cookies" element={<CookiesPage />} />
          <Route path="/legal/ai-transparency" element={<AiTransparencyPage />} />
          <Route path="/legal/billing-terms" element={<BillingTermsPage />} />
          <Route path="/legal/billing" element={<BillingTermsPage />} />
          <Route path="/legal/ip-policy" element={<IpPolicyPage />} />
          <Route path="/legal/intellectual-property" element={<IpPolicyPage />} />
          <Route path="/legal/content-and-ip" element={<IpPolicyPage />} />
          <Route path="/legal/notice" element={<LegalNoticePage />} />
          <Route path="/legal/notices" element={<LegalNoticePage />} />
          <Route path="/legal/mentions-legales" element={<LegalNoticePage />} />
          <Route path="/legal/contact" element={<LegalContactPage />} />

          {/* Fallback 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuraProvider>
  );
}
