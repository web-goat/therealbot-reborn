import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
    throw new Error('DATABASE_URL fehlt');
}

export const db = new Pool({
    connectionString: databaseUrl,
});