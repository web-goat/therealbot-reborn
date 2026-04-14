import type { Command } from '../types/command.js';
import { getAskResponse } from '../utils/ask/getAskResponse.js';
import { commandMap } from '../utils/commandRegistry.js';

export const askCommand: Command = {
    name: 'ask',
    aliases: ['talk'],
    description: 'Antwortet auf Fragen und Gelaber.',
    async execute(message, args) {
        const result = getAskResponse(message, args);

        if (!result) {
            await message.reply('Nerv mich nicht!!');
            return;
        }

        if (result.type === 'reply') {
            await message.reply(result.content);
            return;
        }

        const forwardedCommand = commandMap.get(result.commandName);

        if (!forwardedCommand) {
            await message.reply('Ich wollte was Schlaues tun, aber mein Programmierer war wieder kreativ.');
            return;
        }

        await forwardedCommand.execute(message, []);
    },
};