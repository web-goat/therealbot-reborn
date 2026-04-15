import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './config.js';
import { db } from './db.js';
import { registerGuildMemberAddEvent } from './events/guildMemberAdd.js';
import { registerMessageCreateEvent } from './events/messageCreate.js';
import { registerMessageDeleteEvent } from './events/messageDelete.js';
import { registerMessageUpdateEvent } from './events/messageUpdate.js';
import { registerReadyEvent } from './events/ready.js';
import { initializeAutotalkState } from './utils/autotalkState.js';

await initializeAutotalkState();

const dbHealthcheck = await db.query('SELECT 1 AS connected');
console.log('✅ Postgres verbunden:', dbHealthcheck.rows[0]);

await db.query(`
    CREATE TABLE IF NOT EXISTS bot_notes (
                                             id SERIAL PRIMARY KEY,
                                             note TEXT NOT NULL,
                                             created_at TIMESTAMP DEFAULT NOW()
        )
`);
console.log('✅ Tabelle bot_notes ist bereit');

await db.query(`
    INSERT INTO bot_notes (note)
    VALUES ($1)
`, ['TheRealBot war hier 👀']);

const notes = await db.query(`
    SELECT * FROM bot_notes
    ORDER BY created_at DESC
    LIMIT 5
`);

console.log('🧠 Letzte Notes:', notes.rows);
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

registerReadyEvent(client);
registerGuildMemberAddEvent(client);
registerMessageCreateEvent(client);
registerMessageDeleteEvent(client);
registerMessageUpdateEvent(client);

await client.login(config.token);