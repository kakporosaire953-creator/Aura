import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT || 3000);

export function createApiApp() {
  const api = express.Router();
  api.use(express.json());

  // État réel du produit — jamais de fausse fonctionnalité.
  api.get('/status', (_req, res) => {
    res.json({
      name: 'Aura',
      phase: 'renaissance',
      tagline: "De l'idée au résultat.",
      features: {
        publicSite: 'live',
        intro: 'live',
        sculpture3d: 'live',
        accounts: 'rebuilding',
        chat: 'rebuilding',
        explore: 'rebuilding',
        studio: 'rebuilding',
        missions: 'rebuilding',
      },
    });
  });

  return api;
}

async function main() {
  const app = express();
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
