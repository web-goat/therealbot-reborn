import {type Client, Events, type Message} from 'discord.js';
import {config} from '../config.js';
import {commandMap} from '../utils/commandRegistry.js';
import {getInterjection} from '../utils/interjections.js';
import {isAutotalkEnabledForChannel} from '../utils/autotalkState.js';
import {trackCreatedMessage} from '../services/messageTrackingService.js';
import {incrementBotInteractionCount} from "../repositories/useMemoryRepository.js";

function isGuildMessage(message: Message): message is Message<true> {
    return Boolean(message.guild);
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

        if (!message.content.startsWith(config.prefix)) {
            if (isAutotalkEnabledForChannel(message.channel.id)) {
                const interjection = getInterjection(message.channel.id, message.content);

                if (interjection) {
                    await message.reply(interjection);
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