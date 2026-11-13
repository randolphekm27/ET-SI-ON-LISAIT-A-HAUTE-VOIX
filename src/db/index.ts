import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export function isCloudSqlConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(
    url &&
      !url.includes('[VOTRE_MOT_DE_PASSE') &&
      !url.includes('[YOUR-PASSWORD]'),
  );
}

export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
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

const pool = createPool();

export async function testDatabaseConnection(): Promise<boolean> {
  if (!isCloudSqlConfigured()) return false;
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('Database health check failed:', (err as Error).message);
    return false;
  }
}

export const db = drizzle(pool, { schema });
