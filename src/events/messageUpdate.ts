import { Events, type Client, type Message } from 'discord.js';
import { getEditSnitchRoast } from '../utils/editSnitchRoasts.js';
import { getCachedMessage, updateCachedMessage } from '../utils/snitchStore.js';

function isRealMessage(message: unknown): message is Message<true> {
    return Boolean(
        message &&
        typeof message === 'object' &&
        'guild' in message &&
        'author' in message &&
        'content' in message &&
        'channel' in message,
    );
}

export function registerMessageUpdateEvent(client: Client): void {
    client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
        if (!isRealMessage(newMessage)) return;
        if (!newMessage.guild) return;
        if (newMessage.author.bot) return;

        const cached = getCachedMessage(newMessage.id);

        if (!cached) {
            if (newMessage.content.trim()) {
                updateCachedMessage(newMessage.id, newMessage.content);
            }
            return;
        }

        const previousContent = cached.content.trim();
        const nextContent = newMessage.content.trim();

        if (!previousContent || !nextContent) return;
        if (previousContent === nextContent) return;

        const roast = getEditSnitchRoast();

        await newMessage.channel.send({
            content:
                `✏️ <@${cached.authorId}> hat gerade im Channel **#${cached.channelName}** eine Nachricht bearbeitet.\n\n` +
                `**Vorher:**\n> ${previousContent}\n\n` +
                `**Nachher:**\n> ${nextContent}\n\n` +
                `${roast}`,
        });

        updateCachedMessage(newMessage.id, nextContent);
    });
}