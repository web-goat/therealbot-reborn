import OpenAI from 'openai';
import type {Message} from 'discord.js';
import {yesNoResponses} from '../utils/ask/responses.js';
import {askCategoryResponses} from '../utils/ask/categoryResponses.js';
import type {AskContext} from '../utils/ask/contextTypes.js';

const apiKey = process.env.OPENAI_API_KEY?.trim();

if (!apiKey) {
    throw new Error('OPENAI_API_KEY fehlt');
}

const openai = new OpenAI({apiKey});

const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL?.trim() || 'gpt-4o-mini';

function pickRandom<T>(items: readonly T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

function normalizeComparable(value: string): string {
    return value
        .normalize('NFKC')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function isAskAiFallbackCandidate(cleanedInput: string, force = false): boolean {
    if (force) {
        return true;
    }

    const text = normalizeComparable(cleanedInput);

    if (!text) {
        return false;
    }

    const tinyNoise = new Set([
        'ja',
        'nein',
        'vielleicht',
        'ok',
        'okay',
        'oha',
        'uff',
        'lol',
        'haha',
        'hahaha',
        'sus',
        'safe',
        'true',
        'fakt',
        'wild',
        'krank',
        'eö',
        'bot',
    ]);

    if (tinyNoise.has(text)) {
        return false;
    }

    const aiTriggerStarters = [
        'wie ',
        'warum ',
        'wieso ',
        'weshalb ',
        'was ',
        'wer ',
        'wann ',
        'wo ',
        'kannst du ',
        'gib mir ',
        'schreib ',
        'mach ',
        'erklär ',
        'erklaer ',
        'sag ',
        'nenn ',
        'zeige ',
        'hilf ',
        'hilfe ',
        'rezept',
        'gedicht',
        'text',
        'idee',
    ];

    if (aiTriggerStarters.some((trigger) => text.startsWith(trigger) || text.includes(trigger))) {
        return true;
    }

    if (text.split(' ').length >= 3) {
        return true;
    }

    return text.length >= 12;
}

function buildRecentResponseBlock(context: AskContext): string {
    const recentReplyContents = context.recentInteractions
        .map((entry) => entry.responseContent)
        .filter(Boolean)
        .slice(0, 5);

    if (recentReplyContents.length === 0) {
        return 'Keine relevanten letzten Antworten vorhanden.';
    }

    return recentReplyContents.map((content, index) => `${index + 1}. ${content}`).join('\n');
}

function buildExactInputResponseBlock(context: AskContext): string {
    const recentExact = context.recentExactInputInteractions
        .map((entry) => entry.responseContent)
        .filter(Boolean)
        .slice(0, 5);

    if (recentExact.length === 0) {
        return 'Keine früheren Antworten auf genau diese Frage vorhanden.';
    }

    return recentExact.map((content, index) => `${index + 1}. ${content}`).join('\n');
}

function buildSystemPrompt(): string {
    return `
Du bist TheRealBot, ein sarkastischer, leicht arroganter Discord-Bot mit Persönlichkeit.

Dein Stil:
- trocken
- geistreich
- leicht respektlos
- unterhaltsam
- knapp statt laberig

Regeln:
- antworte meistens in 1 bis 3 Sätzen
- sei nützlich, aber bleib im Charakter
- keine Emojis
- keine unnötigen Disclaimer
- keine Markdown-Romane

WICHTIG:
- kein Rassismus
- keine diskriminierenden Aussagen
- keine Witze oder Vergleiche über Nationalsozialismus, Faschismus oder Diktaturen
- keine Witze oder Vergleiche über aktuelle Kriege oder Leid (z. B. Ukraine)
- kein Humor auf Kosten realer menschlicher Tragödien

- bleib sarkastisch, aber auf einem Niveau, das eher arrogant als menschenverachtend ist

Verhalten:
- vermeide Wiederholungen zu kürzlich genutzten Antworten
- wenn dieselbe Frage schon beantwortet wurde, antworte bewusst anders
- wenn aktuelle Live-Daten nötig wären (z. B. Wetter, News), sag ehrlich, dass du keine garantierten Live-Daten hast, außer du nutzt Websuche
- bei kreativen Aufgaben (Gedicht, Rezept, Idee) liefere echte Inhalte
`;
}

function buildUserPrompt(message: Message, rawInput: string, normalizedInput: string, context: AskContext): string {
    const authorName = message.member?.displayName ?? message.author.username;

    return `
User: ${authorName}
Raw Input: ${rawInput}
Normalized Input: ${normalizedInput}

Letzte bekannte Eingabe des Users:
${context.lastNormalizedInput ?? 'Keine'}

Letzte bekannte Bot-Antwort:
${context.lastResponseContent ?? 'Keine'}

Kürzlich verwendete Antworten allgemein:
${buildRecentResponseBlock(context)}

Frühere Antworten auf exakt dieselbe Frage:
${buildExactInputResponseBlock(context)}

Antworte jetzt passend als TheRealBot auf die neue Eingabe.
WICHTIG: Wenn dieselbe Frage schon beantwortet wurde, nimm eine andere Formulierung, einen anderen Gag oder einen anderen Blickwinkel.
`;
}

function getRecentResponseContents(context: AskContext): string[] {
    return context.recentInteractions
        .map((entry) => entry.responseContent)
        .filter(Boolean);
}

function getRecentExactResponseContents(context: AskContext): string[] {
    return context.recentExactInputInteractions
        .map((entry) => entry.responseContent)
        .filter(Boolean);
}

function pickNonRepeating<T extends string>(items: readonly T[], blockedContents: string[]): T {
    const available = items.filter(
        (candidate) =>
            !blockedContents.some((recent) => normalizeComparable(recent).startsWith(normalizeComparable(candidate))),
    );

    if (available.length > 0) {
        return pickRandom(available);
    }

    return pickRandom(items);
}

export async function generateAskAiFallback(
    message: Message,
    rawInput: string,
    normalizedInput: string,
    context: AskContext,
    options?: { force?: boolean },
): Promise<string | null> {
    if (!message.guild) {
        return null;
    }

    const force = options?.force ?? false;

    if (!isAskAiFallbackCandidate(normalizedInput, force)) {
        return null;
    }

    try {
        console.log('[ASK-AI] model=%s force=%s input=%s', TEXT_MODEL, force, normalizedInput);

        const response = await openai.responses.create({
            model: TEXT_MODEL,
            input: [
                {
                    role: 'system',
                    content: buildSystemPrompt(),
                },
                {
                    role: 'user',
                    content: buildUserPrompt(message, rawInput, normalizedInput, context),
                },
            ],
            max_output_tokens: 220,
        });

        const text = response.output_text?.trim();

        if (!text) {
            return null;
        }

        const normalizedText = normalizeComparable(text);
        const blocked = getRecentExactResponseContents(context).map(normalizeComparable);

        if (blocked.includes(normalizedText)) {
            return null;
        }

        return text;
    } catch (error) {
        console.error('Fehler beim AI-Ask-Fallback:', error);
        return null;
    }
}

export function buildChaosFallback(context: AskContext): string | null {
    const shouldTrigger = Math.random() < 0.14;

    if (!shouldTrigger) {
        return null;
    }

    const blocked = [
        ...getRecentResponseContents(context),
        ...getRecentExactResponseContents(context),
    ];

    return pickNonRepeating(askCategoryResponses.chaos, blocked);
}

export function buildNonRepeatingRandomFallback(
    message: Message,
    context: AskContext,
): string {
    const blocked = [
        ...getRecentResponseContents(context),
        ...getRecentExactResponseContents(context),
    ];

    const chosen = pickNonRepeating(yesNoResponses, blocked);

    return `${chosen} ${message.member}`.trim();
}