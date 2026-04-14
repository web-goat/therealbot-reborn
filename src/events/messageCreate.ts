import { Events, type Client } from 'discord.js';
import { config } from '../config.js';
import { commandMap } from '../utils/commandRegistry.js';

export function registerMessageCreateEvent(client: Client): void {
    client.on(Events.MessageCreate, async (message) => {
        if (message.author.bot || !message.guild) return;
        if (!message.content.startsWith(config.prefix)) return;

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