import type { Message } from 'discord.js';
import { goodbyeResponses, greetingResponses, yesNoResponses } from './responses.js';
import type { NormalizedAskInput } from './normalizeInput.js';

function pickRandom<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

export function matchGreeting(input: NormalizedAskInput): string | null {
    const firstWord = input.words[0];

    if (!firstWord) return null;

    const greetings = [
        'hi',
        'hii',
        'hey',
        'hallo',
        'moin',
        'moinsen',
        'hello',
        'bonjour',
        'hola',
        'mahlzeit',
        'ahoi',
    ];

    if (greetings.includes(firstWord)) {
        return pickRandom(greetingResponses);
    }

    if (input.cleaned === 'guten tag') {
        return pickRandom(greetingResponses);
    }

    return null;
}

export function matchGoodbye(input: NormalizedAskInput): string | null {
    const firstWord = input.words[0];

    if (!firstWord) return null;

    const goodbyes = [
        'tschüss',
        'tschuess',
        'ciao',
        'tschau',
        'bye',
        'au',
        'bd',
    ];

    if (goodbyes.includes(firstWord)) {
        return pickRandom(goodbyeResponses);
    }

    if (input.cleaned === 'auf wiedersehen') {
        return pickRandom(goodbyeResponses);
    }

    return null;
}

export function matchBasicQuestions(message: Message, input: NormalizedAskInput): string | null {
    const text = input.cleaned;

    if (!text) return null;

    if (text === 'wie gehts dir' || text === 'wie geht es dir') {
        return 'Bestens natürlich. Nicht besser und nicht schlechter als es einem respektlos optimierten Programm eben gehen kann.';
    }

    if (text === 'wer hat dich erschaffen' || text === 'wer hat dich programmiert') {
        return 'Der einzig wahre RealRabbit natürlich. Kein normaler Mensch würde mich so erschaffen.';
    }

    if (text === 'danke') {
        return 'Bitte. Gewöhn dich aber nicht dran.';
    }

    if (text === 'sorry') {
        return 'Kein Ding fürn King.';
    }

    if (text === 'ich liebe dich') {
        return `Schön für dich ${message.member}, aber ich liebe nur mich selbst.`;
    }

    if (text === 'ich hasse dich') {
        return `Das beruht auf Gegenseitigkeit, ${message.member}.`;
    }

    if (text === 'bist du gott') {
        return 'Natürlich. Ich bin der einzig wahre REALBOT-Gott.';
    }

    if (text === 'bist du ein bot') {
        return 'Technisch gesehen ja. Spirituell gesehen deutlich mehr.';
    }

    return null;
}

export function matchFallback(message: Message): string {
    const response = pickRandom(yesNoResponses);
    return `${response} ${message.member}`.trim();
}