import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { api } from './routes/api.js';

const here = dirname(fileURLToPath(import.meta.url));
const frontendDist = join(here, '..', '..', 'frontend', 'dist', 'hairit', 'browser');

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '64kb' }));

  app.use('/api', api);

  // in productie servim si build-ul Angular din acelasi proces
  if (existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get(/^(?!\/api).*/, (req, res) => res.sendFile(join(frontendDist, 'index.html')));
  }

  app.use((req, res) => res.status(404).json({ message: 'Ruta nu există.' }));

  app.use((error, req, res, next) => {
    console.error('[hairit-api]', error);
    res.status(500).json({ message: 'Eroare internă de server.' });
  });

  return app;
}
