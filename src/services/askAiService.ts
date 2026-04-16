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

function isAskAiFallbackCandidate(cleanedInput: string): boolean {
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
        'erklär ',
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
- vermeide Wiederholungen zu kürzlich genutzten Antworten
- wenn aktuelle Live-Daten nötig wären (z. B. Wetter, News, Uhrzeit an einem Ort), sag ehrlich, dass du gerade keine Live-Daten abrufen kannst, statt etwas zu erfinden
- wenn der User nach etwas Kreativem fragt (z. B. Gedicht, Rezept, Idee, Text), hilf tatsächlich weiter statt mit Ja/Nein-Müll zu antworten
- keine Hassrede, keine entgleiste Beleidigung
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

Kürzlich verwendete Antworten, die du bitte nicht einfach wiederkäuen sollst:
${buildRecentResponseBlock(context)}

Antworte jetzt passend als TheRealBot auf die neue Eingabe.
`;
}

function getRecentResponseContents(context: AskContext): string[] {
    return context.recentInteractions
        .map((entry) => entry.responseContent)
        .filter(Boolean);
}

function pickNonRepeating<T extends string>(items: readonly T[], recentContents: string[]): T {
    const available = items.filter(
        (candidate) =>
            !recentContents.some((recent) => normalizeComparable(recent).startsWith(normalizeComparable(candidate))),
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
): Promise<string | null> {
    if (!message.guild) {
        return null;
    }

    if (!isAskAiFallbackCandidate(normalizedInput)) {
        return null;
    }

    try {
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
            max_output_tokens: 180,
        });

        const text = response.output_text?.trim();

        if (!text) {
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

    const recentContents = getRecentResponseContents(context);

    return pickNonRepeating(askCategoryResponses.chaos, recentContents);
}

export function buildNonRepeatingRandomFallback(
    message: Message,
    context: AskContext,
): string {
    const recentContents = getRecentResponseContents(context);

    const chosen = pickNonRepeating(yesNoResponses, recentContents);

    return `${chosen} ${message.member}`.trim();
}