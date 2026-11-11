import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { enregistrerServiceWorker } from './app/pwa';
import './index.css';

// Uniquement en production : en développement, Vite sert des modules à la
// volée et un cache de service worker fausserait tout.
if (import.meta.env.PROD) enregistrerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
