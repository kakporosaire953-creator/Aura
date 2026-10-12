import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiApp } from './src/server/apiApp.ts';

async function startServer() {
  const app = apiApp;
  const PORT = Number(process.env.PORT) || 3000;

  // --- Vite Middleware in Development / Static in Production ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aura Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
