import type {Command} from '../types/command.js';
import {getAskResponse} from '../utils/ask/getAskResponse.js';
import {normalizeInput} from '../utils/ask/normalizeInput.js';
import {commandMap} from '../utils/commandRegistry.js';
import {trackAskInteraction} from '../services/askTrackingService.js';

export const askCommand: Command = {
    name: 'ask',
    aliases: ['talk'],
    description: 'Antwortet auf Fragen und Gelaber.',
    async execute(message, args) {
        const normalized = normalizeInput(args);
        const result = getAskResponse(message, args);

        if (!result) {
            const fallback = 'Nerv mich nicht!!';
            await trackAskInteraction(message, normalized.raw, normalized.cleaned, null, fallback);
            await message.reply(fallback);
            return;
        }

        await trackAskInteraction(message, normalized.raw, normalized.cleaned, result);

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