import {type Client, Events, type Message} from 'discord.js';
import {config} from '../config.js';
import {commandMap} from '../utils/commandRegistry.js';
import {isAutotalkEnabledForChannel} from '../utils/autotalkState.js';
import {trackCreatedMessage} from '../services/messageTrackingService.js';
import {getAutotalkResponse} from '../services/autotalkService.js';
import {incrementBotInteractionCount} from "../repositories/useMemoryRepository.js";

function isGuildMessage(message: Message): message is Message<true> {
    return Boolean(message.guild);
}

function extractMentionAskArgs(message: Message<true>): string[] | null {
    const botId = message.client.user?.id;

    if (!botId) {
        return null;
    }

    const mentionRegex = new RegExp(`^<@!?${botId}>\\s*`, 'i');

    if (!mentionRegex.test(message.content)) {
        return null;
    }

    const withoutMention = message.content.replace(mentionRegex, '').trim();

    if (!withoutMention) {
        return [];
    }

    return withoutMention.split(/\s+/);
}

export function registerMessageCreateEvent(client: Client): void {
    client.on(Events.MessageCreate, async (message) => {
        if (message.author.bot) {
            return;
        }

        if (!isGuildMessage(message)) {
            return;
        }

        try {
            await trackCreatedMessage(message);
        } catch (error) {
            console.error('Fehler beim Speichern der Nachricht:', error);
        }

        const mentionAskArgs = extractMentionAskArgs(message);

        if (mentionAskArgs !== null) {
            try {
                await incrementBotInteractionCount(
                    message.guild.id,
                    message.author.id,
                    message.author.tag,
                    new Date(),
                );
            } catch (error) {
                console.error('Fehler beim Zählen der Bot-Interaktion:', error);
            }

            const askCommand = commandMap.get('ask');

            if (!askCommand) {
                await message.reply('Ich wollte reagieren, aber mein Ask-System ist geistig abwesend.');
                return;
            }

            try {
                await askCommand.execute(message, mentionAskArgs);
            } catch (error) {
                console.error('Fehler beim Mention-Ask:', error);
                await message.reply('Da ist was explodiert. Sogar beim direkten Ansprechen.');
            }

            return;
        }

        if (!message.content.startsWith(config.prefix)) {
            if (isAutotalkEnabledForChannel(message.channel.id)) {
                try {
                    const autotalkResponse = await getAutotalkResponse(message);

                    if (autotalkResponse) {
                        await message.reply(autotalkResponse);
                    }
                } catch (error) {
                    console.error('Fehler im intelligenten Autotalk:', error);
                }
            }

            return;
        }

        const args = message.content
            .slice(config.prefix.length)
            .trim()
            .split(/\s+/);

        const commandName = args.shift()?.toLowerCase();

        if (!commandName) {
            return;
        }

        try {
            await incrementBotInteractionCount(
                message.guild.id,
                message.author.id,
                message.author.tag,
                new Date(),
            );
        } catch (error) {
            console.error('Fehler beim Zählen der Bot-Interaktion:', error);
        }

        const command = commandMap.get(commandName);

        if (!command) {
            await message.reply(`den Befehl kenne ich nicht, du clown: \`${commandName}\``);
            return;
        }

        try {
            await command.execute(message, args);
        } catch (error) {
            console.error(`Fehler bei Command "${commandName}":`, error);
            await message.reply('da ist was explodiert. professionell ist anders.');
        }
    });
}