import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export function isCloudSqlConfigured(): boolean {
  let url = (process.env.DATABASE_URL || '').trim();
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1).trim();
  }
  return Boolean(
    url &&
      !url.includes('[VOTRE_MOT_DE_PASSE') &&
      !url.includes('[YOUR-PASSWORD]'),
  );
}

export function getCleanDatabaseUrl(): string {
  let url = (process.env.DATABASE_URL || '').trim();
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1).trim();
  }
  return url;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const connectionString = getCleanDatabaseUrl();
    global._postgresPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: process.env.VERCEL ? 1 : 5,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
      allowExitOnIdle: true,
    });

    global._postgresPool.on('error', (err) => {
      console.warn('PostgreSQL pool client idle notification:', err.message);
    });
  }
  return global._postgresPool;
};

export const pool = createPool();
export const db = drizzle(pool, { schema });
