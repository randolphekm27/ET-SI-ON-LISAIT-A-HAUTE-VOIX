import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export function getCleanDatabaseUrl(): string {
  let url = (process.env.DATABASE_URL || '').trim();
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1).trim();
  }
  // Corrige automatiquement la faute de frappe courante /postgre au lieu de /postgres
  if (url.includes('/postgre') && !url.includes('/postgres')) {
    url = url.replace(/\/postgre(?=[\/?#]|$)/g, '/postgres');
  }
  return url;
}

export function isCloudSqlConfigured(): boolean {
  const url = getCleanDatabaseUrl();
  return Boolean(
    url &&
      !url.includes('[VOTRE_MOT_DE_PASSE') &&
      !url.includes('[YOUR-PASSWORD]') &&
      !url.includes('placeholder'),
  );
}

function resolveSslOption(connectionString: string): boolean | { rejectUnauthorized: false } {
  if (!connectionString) return false;
  if (
    connectionString.includes('sslmode=disable') ||
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1')
  ) {
    return false;
  }
  return { rejectUnauthorized: false };
}

export const createPool = () => {
  if (!global._postgresPool) {
    const connectionString = getCleanDatabaseUrl();
    global._postgresPool = new Pool({
      connectionString,
      ssl: resolveSslOption(connectionString),
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
