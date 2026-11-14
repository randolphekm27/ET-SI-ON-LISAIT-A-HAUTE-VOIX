import 'dotenv/config';
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

  const rawUrl = req.url || '/';
  const [rawPathOnly, rawQuery] = rawUrl.split('?');
  const rawPathParam = (req.query as Record<string, string | string[]> | undefined)?.path;
  const paramSegments = Array.isArray(rawPathParam)
    ? rawPathParam.join('/')
    : typeof rawPathParam === 'string'
      ? rawPathParam
      : '';

  let normalizedPath = rawPathOnly || '/';
  if (
    paramSegments &&
    (!normalizedPath.startsWith('/api/') ||
      normalizedPath === '/api' ||
      normalizedPath === '/api/')
  ) {
    normalizedPath = `/api/${paramSegments.replace(/^\/+/, '')}`;
  } else if (!normalizedPath.startsWith('/api')) {
    normalizedPath = `/api/${normalizedPath.replace(/^\/+/, '')}`;
  }

  if (rawQuery) {
    const searchParams = new URLSearchParams(rawQuery);
    searchParams.delete('path');
    const remaining = searchParams.toString();
    req.url = remaining ? `${normalizedPath}?${remaining}` : normalizedPath;
  } else {
    req.url = normalizedPath;
  }
  next();
});

registerApiRoutes(app);

export default function handler(req: any, res: any) {
  return app(req, res);
}
