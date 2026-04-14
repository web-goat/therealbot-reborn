import { Events, type Client } from 'discord.js';

export function registerReadyEvent(client: Client): void {
    client.once(Events.ClientReady, (readyClient) => {
        console.log(`✅ ${readyClient.user.tag} ist wieder auferstanden`);
    });
}