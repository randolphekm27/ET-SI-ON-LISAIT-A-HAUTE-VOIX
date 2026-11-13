import express from 'express';
import { registerApiRoutes } from '../server/api';

const app = express();
app.use(express.json({ limit: '1mb' }));

// Normalize Vercel catch-all path & pre-parsed string bodies if needed
app.use((req, _res, next) => {
  if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
    try {
      req.body = JSON.parse(req.body);
    } catch {
      // ignore malformed string body; route handler will validate
    }
  }

  if (!req.url.startsWith('/api/')) {
    const rawPath = req.query.path;
    const segments = Array.isArray(rawPath)
      ? rawPath.join('/')
      : typeof rawPath === 'string'
        ? rawPath
        : '';
    if (segments) {
      req.url = `/api/${segments.replace(/^\/+/, '')}`;
    } else if (req.url === '/' || req.url === '') {
      req.url = '/api';
    }
  }
  next();
});

registerApiRoutes(app);

export default app;
