import OpenAI from 'openai';
import type {Message} from 'discord.js';
import type {AskContext} from '../utils/ask/contextTypes.js';

const apiKey = process.env.OPENAI_API_KEY?.trim();

if (!apiKey) {
    throw new Error('OPENAI_API_KEY fehlt');
}

const openai = new OpenAI({apiKey});

const CURRENT_INFO_MODEL = process.env.OPENAI_CURRENT_INFO_MODEL?.trim() || 'gpt-4o-mini';

function buildSystemPrompt(): string {
    return `
Du bist TheRealBot, ein sarkastischer, leicht arroganter Discord-Bot mit Persönlichkeit.

Stil:
- trocken
- geistreich
- leicht respektlos
- knapp
- informativ, wenn es um aktuelle Infos geht

Regeln:
- antworte auf Deutsch
- 2 bis 5 Sätze
- keine Emojis
- keine unnötigen Disclaimer
- keine Markdown-Romane
- wenn du aktuelle Informationen gibst, dann konkret und knapp
- bleib sarkastisch, aber nicht menschenverachtend
- kein Rassismus
- keine diskriminierenden Aussagen
- keine Witze oder Vergleiche über Nationalsozialismus, Faschismus oder Diktaturen
- keine Witze oder Vergleiche über aktuelle Kriege oder menschliches Leid
- bei politischen oder tragischen Themen sachlich bleiben, nur leicht trocken im Ton
- wenn es um Stalin, Hitler, NS, Faschismus, Diktatur, Krieg, Genozid oder politische Gewalt geht, antworte nüchtern, kritisch und niemals verharmlosend
`;
}

function buildUserPrompt(message: Message, rawInput: string, normalizedInput: string, context: AskContext): string {
    const authorName = message.member?.displayName ?? message.author.username;

    return `
User: ${authorName}
Raw Input: ${rawInput}
Normalized Input: ${normalizedInput}

Letzte bekannte Bot-Antwort:
${context.lastResponseContent ?? 'Keine'}

Aufgabe:
Beantworte die Anfrage mit aktuellen Informationen aus dem Web.
Wenn es um Wetter geht, gib nach Möglichkeit Ort und grobe Lage/Temperatur an.
Wenn es um aktuelle Politik oder Nachrichten geht, fasse die wichtigsten Punkte knapp zusammen.
Wenn Quellen verfügbar sind, dürfen sie in der Antwort mit auftauchen.
`;
}

export async function generateCurrentInfoReply(
    message: Message,
    rawInput: string,
    normalizedInput: string,
    context: AskContext,
): Promise<string | null> {
    if (!message.guild) {
        return null;
    }

    try {
        console.log('[ASK-CURRENT-INFO] model=%s input=%s', CURRENT_INFO_MODEL, normalizedInput);

        const response = await openai.responses.create({
            model: CURRENT_INFO_MODEL,
            tools: [{type: 'web_search'}],
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
            max_output_tokens: 320,
        });

        const text = response.output_text?.trim();

        if (!text) {
            return null;
        }

        return text;
    } catch (error) {
        console.error('Fehler beim Current-Info-Fallback:', error);
        return null;
    }
}