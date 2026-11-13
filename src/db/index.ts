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
      max: process.env.VERCEL ? 2 : 5,
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

export function resetPool() {
  if (global._postgresPool) {
    global._postgresPool.end().catch(() => {});
    global._postgresPool = undefined;
  }
}

export async function testDatabaseConnection(): Promise<boolean> {
  if (!isCloudSqlConfigured()) return false;
  try {
    const pool = createPool();
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('Database health check failed:', (err as Error).message);
    resetPool();
    return false;
  }
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const instance = drizzle(createPool(), { schema });
    return (instance as any)[prop];
  },
});
