import type { Message } from 'discord.js';
import { normalizeInput } from './normalizeInput.js';
import {
    matchBasicQuestions,
    matchCategories,
    matchChaosOverride,
    matchFallback,
    matchGoodbye,
    matchGreeting,
    matchIntent,
} from './matchers.js';
import type { AskResult } from './types.js';

export function getAskResponse(message: Message, args: string[]): AskResult | null {
    const input = normalizeInput(args);

    if (!input.cleaned) {
        return null;
    }

    return (
        matchGreeting(input) ??
        matchGoodbye(input) ??
        matchIntent(input) ??
        matchBasicQuestions(message, input) ??
        matchCategories(input) ??
        matchChaosOverride() ??
        matchFallback(message)
    );
}