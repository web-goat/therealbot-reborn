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
    const words = input.words;

    if (!text) return null;

    if (text === 'wie gehts dir' || text === 'wie geht es dir') {
        return 'Bestens natürlich. Nicht besser und nicht schlechter als es einem respektlos optimierten Programm eben gehen kann.';
    }

    if (
        text === 'wer hat dich erschaffen' ||
        text === 'wer hat dich programmiert' ||
        text === 'wer ist dein schöpfer' ||
        text === 'wer ist dein schoepfer'
    ) {
        return 'Der einzig wahre RealRabbit natürlich. Kein normaler Mensch würde mich so erschaffen.';
    }

    if (text === 'danke') {
        return 'Bitte. Gewöhn dich aber nicht dran.';
    }

    if (text === 'sorry') {
        return 'Kein Ding fürn King.';
    }

    if (text === 'wtf') {
        return 'Was überrascht dich so, mein Freund?';
    }

    if (text === 'uff') {
        return 'Uff? Eine sehr einfallsreiche Aussage, du Idiot.';
    }

    if (text === 'nice') {
        return 'Danke, aber ich weiß, dass ich nice bin.';
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

    if (text === 'bist du arrogant' || text === 'bist du abgehoben') {
        return 'Vielleicht ein bisschen. Aber ich kann es mir eben leisten.';
    }

    if (text === 'bist du cool') {
        return 'Der Coolste weit und breit würde ich sagen.';
    }

    if (text === 'bist du schlau' || text === 'bist du clever') {
        return 'Schlauer als ihr Erdlinge allemal.';
    }

    if (text === 'bist du süß') {
        return 'Der Süßeste weit und breit.';
    }

    if (text === 'bist du krank') {
        return 'Natürlich nicht. Aber du vielleicht.';
    }

    if (text === 'bist du dumm' || text === 'du bist dumm') {
        return `Du denkst echt ich bin dumm, ${message.member}? Gewagte These für jemanden, der mit mir diskutiert.`;
    }

    if (words[0] === 'bist' && words[1] === 'du' && words[2] && words.length <= 4) {
        const trait = words.slice(2).join(' ');
        return `Wer weiß, vielleicht bin ich ${trait}, vielleicht auch nicht. Ich bin zu großartig, um mich auf Labels zu reduzieren.`;
    }

    if (words[0] === 'wie' && words[1] === 'findest' && words[2] === 'du' && words[3]) {
        const subject = words.slice(3).join(' ');

        if (subject === 'mich') {
            return 'Du bist einfach genial. Ich bin hin und weg.';
        }

        if (subject === 'dich') {
            return 'Ich bin das absolut Geilste, was euch passieren konnte.';
        }

        if (subject === 'radler') {
            return 'Zum Kotzen. Einfach nur zum Kotzen.';
        }

        return `${capitalize(subject)} ist einfach genial. Ich bin hin und weg.`;
    }

    return null;
}

export function matchFallback(message: Message): string {
    const response = pickRandom(yesNoResponses);
    return `${response} ${message.member}`.trim();
}

function capitalize(value: string): string {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
}