import { autotalkConfig } from './autotalkState.js';

const randomComments = [
    'Starke Aussage. Inhaltlich dünn, aber stark.',
    'Ich habe das gelesen und bereue es.',
    'Das klingt illegal, aber interessant.',
    'Bitte fahr fort. Ich will sehen, wie schlimm es noch wird.',
    'Mutig, das öffentlich zu schreiben.',
    'Ich hätte geschwiegen, aber gut.',
    'Das war sprachlich ein Verbrechen.',
    'Ich bin nicht sauer. Nur enttäuscht.',
];

const keywordReactions: Record<string, string[]> = {
    bier: [
        'Hat jemand Bier gesagt? Endlich Niveau.',
        'Bier ist immer ein valider Gesprächsbeitrag.',
        'Jetzt wird’s endlich relevant.',
    ],
    alkohol: [
        'Ich höre nur Lösungsvorschläge.',
        'Das klingt nach einem soliden Abend.',
    ],
    offline: [
        'Offline ist nur ein Mindset.',
        'Ich war nie weg. Ihr wart nur ohne Führung.',
    ],
    tot: [
        'Tot? Ich bin Software, du Genie.',
        'Ich bin näher an Gott als am Tod.',
    ],
    wtf: [
        'Ja, exakt mein Gedanke.',
        'Danke, dass es endlich mal jemand ausspricht.',
    ],
    hilfe: [
        'Hilfe ist relativ.',
        'Kommt drauf an, wie verzweifelt du bist.',
    ],
};

let lastInterjectionAt = 0;

function pickRandom<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

export function getInterjection(content: string): string | null {
    const now = Date.now();

    if (now - lastInterjectionAt < autotalkConfig.cooldownMs) {
        return null;
    }

    const cleaned = content.trim().toLowerCase();

    if (!cleaned) return null;

    for (const [keyword, responses] of Object.entries(keywordReactions)) {
        if (cleaned.includes(keyword)) {
            lastInterjectionAt = now;
            return pickRandom(responses);
        }
    }

    const shouldRandomlyInterject = Math.random() < autotalkConfig.randomChance;

    if (!shouldRandomlyInterject) {
        return null;
    }

    lastInterjectionAt = now;
    return pickRandom(randomComments);
}