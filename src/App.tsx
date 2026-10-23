import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { PrefsProvider } from './app/prefs';
import { AuraIntro, shouldShowIntro } from './components/intro/AuraIntro';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { NotFoundPage } from './pages/NotFoundPage';

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
  const [showIntro, setShowIntro] = useState(() => shouldShowIntro());

  return (
    <PrefsProvider>
      {showIntro && <AuraIntro onDone={() => setShowIntro(false)} />}
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/documentation" element={<DocumentationPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </PrefsProvider>
  );
};
