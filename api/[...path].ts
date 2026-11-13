import express from 'express';
import { registerApiRoutes } from '../server/api.ts';

const app = express();
app.use(express.json({ limit: '1mb' }));

// Normalisation des chemins et corps de requêtes pour Vercel
app.use((req, _res, next) => {
  if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
    try {
      req.body = JSON.parse(req.body);
    } catch {
      // ignore malformed body
    }
  }

  let path = req.url || '/';
  if (!path.startsWith('/api')) {
    const rawPath = (req.query as Record<string, string | string[]> | undefined)?.path;
    const segments = Array.isArray(rawPath)
      ? rawPath.join('/')
      : typeof rawPath === 'string'
        ? rawPath
        : '';
    if (segments) {
      path = `/api/${segments.replace(/^\/+/, '')}`;
    } else {
      path = `/api/${path.replace(/^\/+/, '')}`;
    }
    req.url = path;
  }
  next();
});

registerApiRoutes(app);

export default app;
