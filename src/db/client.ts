import {Pool} from 'pg';

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
    throw new Error('DATABASE_URL fehlt');
}

export const db = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production'
        ? {rejectUnauthorized: false}
        : false,
});