import type {Message} from 'discord.js';
import {normalizeInput} from './normalizeInput.js';
import {
    matchAttachmentOnly,
    matchBasicQuestions,
    matchBotLore,
    matchCategories,
    matchChaosOverride,
    matchContextualFollowUp,
    matchCreatorLore,
    matchFallback,
    matchGoodbye,
    matchGreeting,
    matchIntent,
    matchLegacyQuestions,
    matchReplyContext,
    matchShortReaction,
} from './matchers.js';
import type {AskContext} from './contextTypes.js';
import type {AskResult} from './types.js';

export function getAskResponse(
    message: Message,
    args: string[],
    context: AskContext,
): AskResult | null {
    const input = normalizeInput(args);

    return (
        matchAttachmentOnly(input, context) ??
        matchBotLore(input) ??
        matchCreatorLore(input) ??
        matchContextualFollowUp(message, input, context) ??
        matchReplyContext(message, input, context) ??
        matchShortReaction(message, input, context) ??
        matchGreeting(input) ??
        matchGoodbye(input) ??
        matchIntent(input) ??
        matchLegacyQuestions(message, input) ??
        matchBasicQuestions(message, input) ??
        matchCategories(input) ??
        matchChaosOverride() ??
        matchFallback(message)
    );
}