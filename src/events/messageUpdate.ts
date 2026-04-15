import {type Client, Events, type Message} from 'discord.js';
import {getEditSnitchRoast} from '../utils/editSnitchRoasts.js';
import {trackUpdatedMessage} from '../services/messageTrackingService.js';
import {sanitizeQuotedText} from "../services/discordSanitize.js";

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
    client.on(Events.MessageUpdate, async (_oldMessage, newMessage) => {
        if (!isRealMessage(newMessage)) {
            return;
        }

        if (!newMessage.guild) {
            return;
        }

        if (newMessage.author.bot) {
            return;
        }

        const updated = await trackUpdatedMessage(newMessage);

        if (!updated) {
            return;
        }

        const roast = getEditSnitchRoast();

        await newMessage.channel.send({
            content:
                `✏️ <@${updated.authorId}> hat gerade im Channel **#${updated.channelName}** eine Nachricht bearbeitet.\n\n` +
                `**Vorher:**\n${sanitizeQuotedText(updated.previousContent)}\n\n` +
                `**Nachher:**\n${sanitizeQuotedText(updated.nextContent)}\n\n` +
                `${roast}`,
            allowedMentions: {parse: []},
        });
    });
}