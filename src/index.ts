import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './config.js';
import { registerMessageCreateEvent } from './events/messageCreate.js';
import { registerReadyEvent } from './events/ready.js';
import { initializeAutotalkState } from './utils/autotalkState.js';

await initializeAutotalkState();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

registerReadyEvent(client);
registerMessageCreateEvent(client);

await client.login(config.token);