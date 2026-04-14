import type { Command } from '../types/command.js';

export const helpCommand: Command = {
    name: 'help',
    aliases: ['hilfe'],
    description: 'Zeigt Hilfe an.',
    async execute(message) {
        await message.reply('Ich bin wieder da. Fürchte mich.');
    },
};