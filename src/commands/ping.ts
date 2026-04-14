import type { Command } from '../types/command.js';

export const pingCommand: Command = {
    name: 'ping',
    description: 'Antwortet mit pong.',
    async execute(message) {
        await message.reply('pong du opfer 😄');
    },
};