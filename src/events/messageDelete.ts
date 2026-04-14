import { Events, type Client } from 'discord.js';
import { deleteCachedMessage, getCachedMessage } from '../utils/snitchStore.js';
import { getSnitchRoast } from '../utils/snitchRoasts.js';

export function registerMessageDeleteEvent(client: Client): void {
    client.on(Events.MessageDelete, async (message) => {
        if (!message.guild) return;
        if (message.author?.bot) return;

        const cached = getCachedMessage(message.id);

        if (!cached) {
            return;
        }

        deleteCachedMessage(message.id);

        const content = cached.content.trim();

        if (!content) {
            return;
        }

        const roast = getSnitchRoast();

        await message.channel.send({
            content:
                `👀 <@${cached.authorId}> hat gerade im Channel **#${cached.channelName}** eine Nachricht gelöscht.\n\n` +
                `**Gelöschte Nachricht:**\n> ${content}\n\n` +
                `${roast}`,
        });
    });
}