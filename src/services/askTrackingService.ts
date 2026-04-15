import type {Message} from 'discord.js';
import type {AskResult} from '../utils/ask/types.js';
import {logAskInteraction} from '../repositories/askInteractionRepository.js';

export async function trackAskInteraction(
    message: Message,
    rawInput: string,
    normalizedInput: string,
    result: AskResult | null,
    fallbackContent?: string,
): Promise<void> {
    if (!message.guild) {
        return;
    }

    const responseType = result?.type ?? 'reply';
    const responseContent = result
        ? result.type === 'reply'
            ? result.content
            : result.commandName
        : (fallbackContent ?? '');

    await logAskInteraction({
        guildId: message.guild.id,
        channelId: message.channel.id,
        userId: message.author.id,
        userTag: message.author.tag,
        rawInput,
        normalizedInput,
        responseType,
        responseContent,
    });
}