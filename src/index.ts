import {Client, GatewayIntentBits} from 'discord.js';
import {config} from './config.js';
import {initializeDatabase} from './db/init.js';
import {registerGuildMemberAddEvent} from './events/guildMemberAdd.js';
import {registerMessageCreateEvent} from './events/messageCreate.js';
import {registerMessageDeleteEvent} from './events/messageDelete.js';
import {registerMessageUpdateEvent} from './events/messageUpdate.js';
import {registerReadyEvent} from './events/ready.js';
import {initializeAutotalkState} from './utils/autotalkState.js';

await initializeDatabase();
await initializeAutotalkState();

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