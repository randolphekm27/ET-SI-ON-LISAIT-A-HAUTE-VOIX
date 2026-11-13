import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

// Charge les variables d'environnement depuis .env puis .env.local
dotenv.config();
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: true });
}

let databaseUrl = (process.env.DATABASE_URL || '').trim();
if ((databaseUrl.startsWith('"') && databaseUrl.endsWith('"')) || (databaseUrl.startsWith("'") && databaseUrl.endsWith("'"))) {
  databaseUrl = databaseUrl.slice(1, -1).trim();
}
if (databaseUrl.includes('/postgre') && !databaseUrl.includes('/postgres')) {
  databaseUrl = databaseUrl.replace(/\/postgre(?=[\/?#]|$)/g, '/postgres');
}

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL est manquante dans les variables d'environnement. " +
      'Renseignez votre chaîne de connexion Supabase (Transaction Pooler port 6543) dans votre fichier .env ou .env.local.',
  );
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: {
    url: databaseUrl,
    ssl: { rejectUnauthorized: false },
  },
  verbose: true,
});
