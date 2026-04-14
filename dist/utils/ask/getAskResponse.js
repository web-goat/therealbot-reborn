import { normalizeInput } from './normalizeInput.js';
import { matchBasicQuestions, matchFallback, matchGoodbye, matchGreeting, } from './matchers.js';
export function getAskResponse(message, args) {
    const input = normalizeInput(args);
    if (!input.cleaned) {
        return null;
    }
    return (matchGreeting(input) ??
        matchGoodbye(input) ??
        matchBasicQuestions(message, input) ??
        matchFallback(message));
}
