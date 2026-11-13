import express from 'express';
import { registerApiRoutes } from '../server/api';

const app = express();
app.use(express.json({ limit: '1mb' }));

// Normalize rewritten Vercel path (?__route=...) back to /api/...
app.use((req, _res, next) => {
  const routeParam = req.query.__route;
  if (typeof routeParam === 'string' && !req.path.startsWith(`/api/${routeParam}`)) {
    const cleanRoute = routeParam.replace(/^\/+/, '');
    const restParams = new URLSearchParams();
    for (const [k, v] of Object.entries(req.query)) {
      if (k !== '__route' && typeof v === 'string') {
        restParams.append(k, v);
      }
    }
    const qs = restParams.toString();
    req.url = `/api/${cleanRoute}${qs ? `?${qs}` : ''}`;
  }
  next();
});

registerApiRoutes(app);

export default app;
