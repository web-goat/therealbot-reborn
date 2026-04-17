import type {Command} from '../types/command.js';
import {getAskResponse} from '../utils/ask/getAskResponse.js';
import {normalizeInput} from '../utils/ask/normalizeInput.js';
import {commandMap} from '../utils/commandRegistry.js';
import {trackAskInteraction} from '../services/askTrackingService.js';
import {buildAskContext} from '../services/askContextService.js';
import {
    buildChaosFallback,
    buildNonRepeatingRandomFallback,
    buildNonRepeatingStarter,
    generateAskAiFallback,
} from '../services/askAiService.js';
import {generateCurrentInfoReply} from '../services/askCurrentInfoService.js';

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

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

            if (result.type === 'reply_then_ai') {
                await message.reply(result.content);

                await sleep(900);

                const aiReply = await generateAskAiFallback(
                    message,
                    normalized.raw,
                    normalized.cleaned,
                    context,
                    {force: true},
                );

                if (aiReply) {
                    const starters = [
                        'Na gut. Ich hab\'s mir anders überlegt.',
                        'Na schön. Ein kurzer Moment der Großzügigkeit.',
                        'Widerwillig, aber effizient: hier die brauchbare Version.',
                        'Ich hasse es, hilfreich zu wirken, aber bitte.',
                        'Ausnahmsweise liefere ich jetzt sogar Inhalt nach.',
                    ];

                    const starter = buildNonRepeatingStarter(starters, context);
                    const finalReply = `${starter} ${aiReply}`;
                    const aiResult = {type: 'reply' as const, content: finalReply};
                    await trackAskInteraction(message, normalized.raw, normalized.cleaned, aiResult);
                    await message.reply(finalReply);
                }

                return;
            }

            if (result.type === 'reply_then_ai_current_info') {
                await message.reply(result.content);

                await sleep(1100);

                const currentInfoReply = await generateCurrentInfoReply(
                    message,
                    normalized.raw,
                    normalized.cleaned,
                    context,
                );

                if (currentInfoReply) {
                    const starters = [
                        'Na gut. Weil ich eh alles weiß:',
                        'Schön, dann jetzt die peinlich präzise Version:',
                        'Widerwillig serviere ich dir jetzt sogar echte Gegenwartsinfos:',
                        'Ich hab kurz in die Realität geschaut. Bitte sehr:',
                        'Ausnahmsweise mit belastbarem Inhalt statt nur Attitüde:',
                    ];

                    const starter = buildNonRepeatingStarter(starters, context);
                    const finalReply = `${starter} ${currentInfoReply}`;
                    const currentInfoResult = {type: 'reply' as const, content: finalReply};
                    await trackAskInteraction(message, normalized.raw, normalized.cleaned, currentInfoResult);
                    await message.reply(finalReply);
                    return;
                }

                const aiReply = await generateAskAiFallback(
                    message,
                    normalized.raw,
                    normalized.cleaned,
                    context,
                    {force: true},
                );

                if (aiReply) {
                    const starters = [
                        'Na gut. Ich hab\'s mir anders überlegt.',
                        'Na schön. Dann eben ohne Live-Glanz, aber mit Verstand.',
                        'Ausnahmsweise helfe ich dir jetzt wirklich weiter.',
                        'Widerwillig liefere ich die brauchbare Version nach.',
                    ];

                    const starter = buildNonRepeatingStarter(starters, context);
                    const finalReply = `${starter} ${aiReply}`;
                    const aiResult = {type: 'reply' as const, content: finalReply};
                    await trackAskInteraction(message, normalized.raw, normalized.cleaned, aiResult);
                    await message.reply(finalReply);
                }

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