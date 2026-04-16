import type {Command} from '../types/command.js';
import {getAskResponse} from '../utils/ask/getAskResponse.js';
import {normalizeInput} from '../utils/ask/normalizeInput.js';
import {commandMap} from '../utils/commandRegistry.js';
import {trackAskInteraction} from '../services/askTrackingService.js';
import {buildAskContext} from '../services/askContextService.js';
import {buildChaosFallback, buildNonRepeatingRandomFallback, generateAskAiFallback,} from '../services/askAiService.js';

export const askCommand: Command = {
    name: 'ask',
    aliases: ['talk'],
    description: 'Antwortet auf Fragen und Gelaber.',
    async execute(message, args) {
        const normalized = normalizeInput(args);
        const context = await buildAskContext(message);
        const result = getAskResponse(message, args, context);

        if (result) {
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
            return;
        }

        const aiReply = await generateAskAiFallback(
            message,
            normalized.raw,
            normalized.cleaned,
            context,
        );

        if (aiReply) {
            const aiResult = {type: 'reply' as const, content: aiReply};
            await trackAskInteraction(message, normalized.raw, normalized.cleaned, aiResult);
            await message.reply(aiReply);
            return;
        }

        const chaosReply = buildChaosFallback(context);

        if (chaosReply) {
            const chaosResult = {type: 'reply' as const, content: chaosReply};
            await trackAskInteraction(message, normalized.raw, normalized.cleaned, chaosResult);
            await message.reply(chaosReply);
            return;
        }

        const fallback = buildNonRepeatingRandomFallback(message, context);
        await trackAskInteraction(message, normalized.raw, normalized.cleaned, null, fallback);
        await message.reply(fallback);
    },
};