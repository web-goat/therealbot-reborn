import { Events, type Client } from 'discord.js';
import { config } from '../config.js';
import { commandMap } from '../utils/commandRegistry.js';
import { getInterjection } from '../utils/interjections.js';
import { isAutotalkEnabledForChannel } from '../utils/autotalkState.js';
import { cacheMessage } from '../utils/snitchStore.js';

export function registerMessageCreateEvent(client: Client): void {
    client.on(Events.MessageCreate, async (message) => {
        if (message.author.bot || !message.guild) return;

        cacheMessage({
            messageId: message.id,
            authorId: message.author.id,
            authorTag: message.author.tag,
            channelId: message.channel.id,
            channelName: 'name' in message.channel ? message.channel.name ?? 'unbekannt' : 'unbekannt',
            content: message.content,
            createdAt: message.createdTimestamp,
        });

        if (!message.content.startsWith(config.prefix)) {
            if (isAutotalkEnabledForChannel(message.channel.id)) {
                const interjection = getInterjection(message.content);

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

        if (!commandName) return;

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