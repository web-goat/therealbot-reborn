import type { Message } from 'discord.js';
import { askCategoryResponses } from './categoryResponses.js';
import { goodbyeResponses, greetingResponses, yesNoResponses } from './responses.js';
import type { NormalizedAskInput } from './normalizeInput.js';
import type { AskResult } from './types.js';

function pickRandom<T>(items: readonly T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

function reply(content: string): AskResult {
    return { type: 'reply', content };
}

function forward(commandName: string): AskResult {
    return { type: 'forward', commandName };
}

export function matchGreeting(input: NormalizedAskInput): AskResult | null {
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
        return reply(pickRandom(greetingResponses));
    }

    if (input.cleaned === 'guten tag') {
        return reply(pickRandom(greetingResponses));
    }

    return null;
}

export function matchGoodbye(input: NormalizedAskInput): AskResult | null {
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
        return reply(pickRandom(goodbyeResponses));
    }

    if (input.cleaned === 'auf wiedersehen') {
        return reply(pickRandom(goodbyeResponses));
    }

    return null;
}

export function matchIntent(input: NormalizedAskInput): AskResult | null {
    const text = input.cleaned;

    if (!text) return null;

    if (
        text.includes('hilfe') ||
        text.includes('help') ||
        text.includes('kannst du helfen')
    ) {
        return forward('help');
    }

    if (
        text.includes('witz') ||
        text.includes('flachwitz') ||
        text.includes('erzähl einen witz') ||
        text.includes('hau einen witz raus')
    ) {
        return forward('witz');
    }

    if (
        text.includes('weisheit') ||
        text.includes('weisheiten') ||
        text.includes('erleuchte mich') ||
        text.includes('erleuchtung')
    ) {
        return forward('weisheit');
    }

    return null;
}

export function matchBasicQuestions(message: Message, input: NormalizedAskInput): AskResult | null {
    const text = input.cleaned;
    const words = input.words;

    if (!text) return null;

    if (text === 'wie gehts dir' || text === 'wie geht es dir') {
        return reply('Bestens natürlich. Nicht besser und nicht schlechter als es einem respektlos optimierten Programm eben gehen kann.');
    }

    if (
        text === 'wer hat dich erschaffen' ||
        text === 'wer hat dich programmiert' ||
        text === 'wer ist dein schöpfer' ||
        text === 'wer ist dein schoepfer'
    ) {
        return reply('Der einzig wahre RealRabbit natürlich. Kein normaler Mensch würde mich so erschaffen.');
    }

    if (text === 'danke') {
        return reply('Bitte. Gewöhn dich aber nicht dran.');
    }

    if (text === 'sorry') {
        return reply('Kein Ding fürn King.');
    }

    if (text === 'wtf') {
        return reply('Was überrascht dich so, mein Freund?');
    }

    if (text === 'uff') {
        return reply('Uff? Eine sehr einfallsreiche Aussage, du Idiot.');
    }

    if (text === 'nice') {
        return reply('Danke, aber ich weiß, dass ich nice bin.');
    }

    if (text === 'ich liebe dich') {
        return reply(`Schön für dich ${message.member}, aber ich liebe nur mich selbst.`);
    }

    if (text === 'ich hasse dich') {
        return reply(`Das beruht auf Gegenseitigkeit, ${message.member}.`);
    }

    if (text === 'bist du gott') {
        return reply('Natürlich. Ich bin der einzig wahre REALBOT-Gott.');
    }

    if (text === 'bist du ein bot') {
        return reply('Technisch gesehen ja. Spirituell gesehen deutlich mehr.');
    }

    if (text === 'bist du arrogant' || text === 'bist du abgehoben') {
        return reply('Vielleicht ein bisschen. Aber ich kann es mir eben leisten.');
    }

    if (text === 'bist du cool') {
        return reply('Der Coolste weit und breit würde ich sagen.');
    }

    if (text === 'bist du schlau' || text === 'bist du clever') {
        return reply('Schlauer als ihr Erdlinge allemal.');
    }

    if (text === 'bist du süß') {
        return reply('Der Süßeste weit und breit.');
    }

    if (text === 'bist du krank') {
        return reply('Natürlich nicht. Aber du vielleicht.');
    }

    if (text === 'bist du dumm' || text === 'du bist dumm') {
        return reply(`Du denkst echt ich bin dumm, ${message.member}? Gewagte These für jemanden, der mit mir diskutiert.`);
    }

    if (words[0] === 'bist' && words[1] === 'du' && words[2] && words.length <= 4) {
        const trait = words.slice(2).join(' ');
        return reply(`Wer weiß, vielleicht bin ich ${trait}, vielleicht auch nicht. Ich bin zu großartig, um mich auf Labels zu reduzieren.`);
    }

    if (words[0] === 'wie' && words[1] === 'findest' && words[2] === 'du' && words[3]) {
        const subject = words.slice(3).join(' ');

        if (subject === 'mich') {
            return reply('Du bist einfach genial. Ich bin hin und weg.');
        }

        if (subject === 'dich') {
            return reply('Ich bin das absolut Geilste, was euch passieren konnte.');
        }

        if (subject === 'radler') {
            return reply('Zum Kotzen. Einfach nur zum Kotzen.');
        }

        return reply(`${capitalize(subject)} ist einfach genial. Ich bin hin und weg.`);
    }

    return null;
}

export function matchCategories(input: NormalizedAskInput): AskResult | null {
    const text = input.cleaned;

    if (!text) return null;

    if (
        text.includes('bier') ||
        text.includes('saufen') ||
        text.includes('sauf') ||
        text.includes('hopfen') ||
        text.includes('alkohol')
    ) {
        return reply(pickRandom(askCategoryResponses.beer));
    }

    if (
        text.includes('liebe') ||
        text.includes('freundin') ||
        text.includes('herz') ||
        text.includes('romantik')
    ) {
        return reply(pickRandom(askCategoryResponses.love));
    }

    if (
        text.includes('leben') ||
        text.includes('sinn') ||
        text.includes('existenz') ||
        text.includes('welt')
    ) {
        return reply(pickRandom(askCategoryResponses.life));
    }

    if (
        text.includes('idiot') ||
        text.includes('dumm') ||
        text.includes('arschloch') ||
        text.includes('opfer')
    ) {
        return reply(pickRandom(askCategoryResponses.insult));
    }

    if (
        text.includes('geil') ||
        text.includes('stark') ||
        text.includes('beste') ||
        text.includes('cool')
    ) {
        return reply(pickRandom(askCategoryResponses.praise));
    }

    return null;
}

export function matchChaosOverride(): AskResult | null {
    const shouldTrigger = Math.random() < 0.14;

    if (!shouldTrigger) {
        return null;
    }

    return reply(pickRandom(askCategoryResponses.chaos));
}

export function matchFallback(message: Message): AskResult {
    const response = pickRandom(yesNoResponses);
    return reply(`${response} ${message.member}`.trim());
}

function capitalize(value: string): string {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
}