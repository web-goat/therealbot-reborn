import { Events } from 'discord.js';
export function registerReadyEvent(client) {
    client.once(Events.ClientReady, (readyClient) => {
        console.log(`✅ ${readyClient.user.tag} ist wieder auferstanden`);
    });
}
