import type { Message } from 'discord.js';
import { normalizeInput } from './normalizeInput.js';
import {
    matchBasicQuestions,
    matchFallback,
    matchGoodbye,
    matchGreeting,
} from './matchers.js';

export function getAskResponse(message: Message, args: string[]): string | null {
    const input = normalizeInput(args);

    if (!input.cleaned) {
        return null;
    }

    return (
        matchGreeting(input) ??
        matchGoodbye(input) ??
        matchBasicQuestions(message, input) ??
        matchFallback(message)
    );
}