import {type Client, Events} from 'discord.js';
import {getSnitchRoast} from '../utils/snitchRoasts.js';
import {trackDeletedMessage} from '../services/messageTrackingService.js';
import {sanitizeQuotedText} from "../services/discordSanitize.js";

export function registerMessageDeleteEvent(client: Client): void {
    client.on(Events.MessageDelete, async (message) => {
        if (!message.guild) {
            return;
        }

        if (message.author?.bot) {
            return;
        }

        const deleted = await trackDeletedMessage(message.id);

        if (!deleted) {
            return;
        }

        const content = deleted.content.trim();

        if (!content) {
            return;
        }

        const roast = getSnitchRoast();

        await message.channel.send({
            content:
                `👀 <@${deleted.authorId}> hat gerade im Channel **#${deleted.channelName}** eine Nachricht gelöscht.\n\n` +
                `**Gelöschte Nachricht:**\n${sanitizeQuotedText(content)}\n\n` +
                `${roast}`,
            allowedMentions: {parse: []},
        });
    });
}