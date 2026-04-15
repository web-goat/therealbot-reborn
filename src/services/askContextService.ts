import type {Message} from 'discord.js';
import {getRecentAskInteractionsForUser} from '../repositories/askInteractionRepository.js';
import type {AskContext} from '../utils/ask/contextTypes.js';

export async function buildAskContext(message: Message): Promise<AskContext> {
    const recentInteractions = message.guild
        ? await getRecentAskInteractionsForUser(message.guild.id, message.author.id, 5)
        : [];

    const last = recentInteractions[0] ?? null;

    return {
        hasAttachments: message.attachments.size > 0,
        attachmentCount: message.attachments.size,
        hasMentions: (message.mentions.members?.size ?? 0) > 0,
        isReply: Boolean(message.reference?.messageId),
        recentInteractions,
        lastNormalizedInput: last?.normalizedInput ?? null,
        lastResponseType: last?.responseType ?? null,
        lastResponseContent: last?.responseContent ?? null,
    };
}