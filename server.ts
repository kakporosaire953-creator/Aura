import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { configurerConfianceProxy, createApiApp } from './server/api';
import { appliquerEnTetesDocument } from './server/en-tetes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT || 3000);

// API unique (dev + Vercel) : voir server/api.ts.
export { createApiApp };

async function main() {
  const app = express();
  // Un seul proxy de confiance (Vercel) ou aucun : voir server/api.ts.
  configurerConfianceProxy(app);
  app.use('/api', createApiApp());

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: __dirname,
      server: { middlewareMode: true, ws: { port: 24678 } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // En-têtes du document en production auto-hébergée (voir server/en-tetes.ts).
    appliquerEnTetesDocument(app);
    const dist = path.join(__dirname, 'dist');
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `Aura — ${isProd ? 'production' : 'développement'} — http://0.0.0.0:${PORT}`,
    );
  });
}

main();
