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
  const searchParams = new URLSearchParams(rawQuery || '');
  const queryPath = req.query?.path;
  const rawPathParam =
    queryPath !== undefined ? queryPath : searchParams.get('path') || '';
  const paramSegments = Array.isArray(rawPathParam)
    ? rawPathParam.join('/')
    : typeof rawPathParam === 'string'
      ? rawPathParam
      : '';

  let normalizedPath = rawPathOnly || '/';
  const isBaseApiHandlerPath =
    !normalizedPath.startsWith('/api/') ||
    normalizedPath === '/api' ||
    normalizedPath === '/api/' ||
    normalizedPath === '/api/index' ||
    normalizedPath === '/api/index/';

  if (paramSegments && isBaseApiHandlerPath) {
    normalizedPath = `/api/${paramSegments.replace(/^\/+/, '')}`;
  } else if (!normalizedPath.startsWith('/api')) {
    normalizedPath = `/api/${normalizedPath.replace(/^\/+/, '')}`;
  }

  searchParams.delete('path');
  const remaining = searchParams.toString();
  req.url = remaining ? `${normalizedPath}?${remaining}` : normalizedPath;
  next();
});

registerApiRoutes(app);

export default function handler(req: any, res: any) {
  return app(req, res);
}
