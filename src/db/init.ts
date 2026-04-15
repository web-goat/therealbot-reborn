import {db} from './client.js';
import {databaseSchemaStatements} from './schema.js';

let initialized = false;

export async function initializeDatabase(): Promise<void> {
    if (initialized) {
        return;
    }

    const healthcheck = await db.query('SELECT 1 AS connected');
    console.log('✅ Postgres verbunden:', healthcheck.rows[0]);

    for (const statement of databaseSchemaStatements) {
        await db.query(statement);
    }

    console.log('✅ Datenbanktabellen sind bereit');
    initialized = true;
}