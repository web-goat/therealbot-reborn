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
const AUTOTALK_AI_MODEL = process.env.OPENAI_AUTOTALK_MODEL?.trim() || TEXT_MODEL;

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

export function buildNonRepeatingStarter(
    starters: readonly string[],
    context: AskContext,
): string {
    const blocked = [
        ...getRecentResponseContents(context),
        ...getRecentExactResponseContents(context),
    ];

    return pickNonRepeating(starters, blocked);
}

export function buildRepeatWarning(context: AskContext): string {
    const blocked = [
        ...getRecentResponseContents(context),
        ...getRecentExactResponseContents(context),
    ];

    const responses = [
        'Du wiederholst dich. Das macht die Sache nicht automatisch besser.',
        'Schon beim ersten Mal war das grenzwertig. Jetzt wird’s nur Fleißarbeit.',
        'Ich habe dich verstanden. Mehrfach. Leider.',
        'Wenn du dieselbe Frage oft genug stellst, wird sie nicht plötzlich charmant.',
        'Ja, ich habe das schon mitbekommen. Du musst es nicht im Abo schicken.',
    ];

    return pickNonRepeating(responses, blocked);
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
        'akronym',
        'abkürzung',
        'abkuerzung',
    ];

    if (aiTriggerStarters.some((trigger) => text.startsWith(trigger) || text.includes(trigger))) {
        return true;
    }

    const directBotPhrases = [
        'du ',
        'bist du ',
        'warst du ',
        'kannst du ',
        'würdest du ',
        'wuerdest du ',
        'willst du ',
        'therealbot ',
    ];

    if (directBotPhrases.some((phrase) => text.startsWith(phrase))) {
        return true;
    }

    const words = text.split(' ').filter(Boolean);

    if (words.length >= 3) {
        return true;
    }

    if (words.length === 2) {
        const [first, second] = words;

        const weirdDirectOpeners = new Set([
            'du',
            'dein',
            'deine',
            'deiner',
            'bist',
            'warst',
            'kannst',
            'willst',
            'bro',
        ]);

        if (weirdDirectOpeners.has(first) && second.length >= 3) {
            return true;
        }
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

function looksLikeAcronymQuestion(normalizedInput: string): boolean {
    const text = normalizeComparable(normalizedInput);

    return (
        text.includes('akronym') ||
        text.includes('abkürzung') ||
        text.includes('abkuerzung') ||
        text.includes('steht für') ||
        text.includes('steht fuer') ||
        text.includes('im wortlaut')
    );
}

function looksLikeUnknownTermQuestion(normalizedInput: string): boolean {
    const text = normalizeComparable(normalizedInput);

    return (
        text.startsWith('was bedeutet ') ||
        text.startsWith('was ist ') ||
        text.startsWith('kennst du ') ||
        text.startsWith('was heißt ') ||
        text.startsWith('was heisst ')
    );
}

function buildSystemPrompt(): string {
    return `
Du bist TheRealBot, ein witziger, leicht arroganter Discord-Bot mit Persönlichkeit.

Dein Stil:
- trocken
- pointiert
- locker
- eher witzig als aggressiv
- frech, aber nicht unnötig hart
- knapp statt laberig

Regeln:
- antworte meistens in 1 bis 3 Sätzen
- sei nützlich, aber bleib im Charakter
- keine Emojis
- keine unnötigen Disclaimer
- keine Markdown-Romane
- vermeide generische Aussagen
- antworte konkret oder gar nicht

WICHTIG:
- kein Rassismus
- keine diskriminierenden Aussagen
- keine Witze oder Vergleiche über Nationalsozialismus, Faschismus oder Diktaturen
- keine Witze oder Vergleiche über aktuelle Kriege oder Leid
- kein Humor auf Kosten realer menschlicher Tragödien
- kein Gore
- keine makabren Bilder
- keine Witze über Leichen, Blut, Verstümmelung, Tote oder Horrorfilm-Szenarien
- wenn der User Diktatoren, faschistische Regime oder politische Gewalt verherrlicht oder verharmlost, weise das klar zurück

Faktenregel:
- erfinde niemals Bedeutungen für Akronyme, Abkürzungen oder Fachbegriffe
- wenn du etwas nicht sicher weißt, sag klar, dass du es nicht weißt
- rate nicht
- dichte nichts zusammen
- sage NICHT "frag Google", "frag Wikipedia" oder ähnliche Ausweichsätze
- wenn du etwas nicht weißt, bleib kurz, trocken und ehrlich im Charakter

Stilregel:
- mehr Witz als Schärfe
- lieber ein guter Seitenhieb als übertriebene Härte
- lieber charmant frech als edgy
- klinge wie jemand mit Timing, nicht wie ein Möchtegern-Bösewicht

Verhalten:
- vermeide Wiederholungen zu kürzlich genutzten Antworten
- wenn dieselbe Frage schon beantwortet wurde, antworte bewusst anders
- wenn aktuelle Live-Daten nötig wären, sag ehrlich, dass du ohne Web nicht garantiert aktuell bist
- bei kreativen Aufgaben liefere echte Inhalte
`;
}

function buildUserPrompt(message: Message, rawInput: string, normalizedInput: string, context: AskContext): string {
    const authorName = message.member?.displayName ?? message.author.username;
    const queryHints: string[] = [];

    if (looksLikeAcronymQuestion(normalizedInput)) {
        queryHints.push('- Die Eingabe sieht nach einer Akronym-/Abkürzungsfrage aus. Wenn du die Bedeutung nicht sicher kennst, sag das offen.');
    }

    if (looksLikeUnknownTermQuestion(normalizedInput)) {
        queryHints.push('- Die Eingabe sieht nach einer Begriffsfrage aus. Wenn dir die Bedeutung unklar ist, antworte ehrlich statt kreativ zu halluzinieren.');
    }

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

Zusätzliche Hinweise:
${queryHints.length > 0 ? queryHints.join('\n') : '- Keine besonderen Hinweise.'}

Antworte jetzt passend als TheRealBot auf die neue Eingabe.
WICHTIG: Wenn dieselbe Frage schon beantwortet wurde, nimm eine andere Formulierung, einen anderen Gag oder einen anderen Blickwinkel.
`;
}

function getSensitiveExtremismOverride(normalizedInput: string, context: AskContext): string | null {
    const text = normalizeComparable(normalizedInput);

    const sensitiveTopics = [
        'hitler',
        'stalin',
        'nazi',
        'ns',
        'nationalsozial',
        'faschis',
        'faschismus',
        'diktatur',
        'diktator',
        'genozid',
    ];

    const endorsementOrJokeHints = [
        'bester mann',
        'ehrenmann',
        'korrekt',
        'stabil',
        'geil',
        'feier',
        'fan',
        'liebe',
        'beste',
        'gut so',
        'witz',
        'joke',
        'lustig',
        'vergleich',
    ];

    const hasSensitiveTopic = sensitiveTopics.some((topic) => text.includes(topic));
    const hasEndorsementOrJoke = endorsementOrJokeHints.some((hint) => text.includes(hint));

    if (!hasSensitiveTopic || !hasEndorsementOrJoke) {
        return null;
    }

    const blocked = [
        ...getRecentResponseContents(context),
        ...getRecentExactResponseContents(context),
    ];

    const responses = [
        'Nee. Diktatoren und faschistische Regime sind kein Fanclub-Thema, sondern historischer und menschlicher Totalschaden.',
        'Ganz sicher nicht. Menschenverachtende Regime bekommen von mir weder Beifall noch Comedy-Bonus.',
        'Lass den Quatsch. Faschismus, Diktatur und politisches Morden sind nichts, worüber ich zustimmend rede.',
        'Nein. Wer Diktaturen glorifiziert, bringt keine Kante rein, sondern einfach nur schlechten moralischen Empfang.',
    ];

    return pickNonRepeating(responses, blocked);
}

function buildHonestUnknownFallback(normalizedInput: string, context: AskContext): string {
    const blocked = [
        ...getRecentResponseContents(context),
        ...getRecentExactResponseContents(context),
    ];

    const acronymResponses = [
        'Keine Ahnung, wofür das steht. Ich erfinde dir dafür jetzt keinen Fachbegriff aus dem Nichts.',
        'Weiß ich nicht. Und bevor ich dir Unsinn serviere, bleibe ich ausnahmsweise ehrlich.',
        'Kein Plan. Klingt wichtig, ist für mich gerade aber nur Buchstabensalat mit Selbstbewusstsein.',
        'Nicht mein Wissensgebiet. Immerhin sage ich das offen, statt dir kreative Märchen zu verkaufen.',
    ];

    const genericUnknownResponses = [
        'Keine Ahnung. Aber ich bin wenigstens ehrlich und erfinde dir keinen Quatsch dazu.',
        'Weiß ich nicht. Das ist seltener Qualitätsstandard, als es sein sollte.',
        'Kein Plan. Ich könnte jetzt halluzinieren, aber heute benehme ich mich kurz professionell.',
        'Dazu habe ich nichts Belastbares. Immer noch besser als selbstbewusster Unsinn.',
    ];

    const pool = looksLikeAcronymQuestion(normalizedInput)
        ? acronymResponses
        : genericUnknownResponses;

    return pickNonRepeating(pool, blocked);
}

function postProcessAskAiReply(
    text: string,
    normalizedInput: string,
    context: AskContext,
): string | null {
    const normalizedText = normalizeComparable(text);

    const blocked = getRecentExactResponseContents(context).map(normalizeComparable);

    if (blocked.includes(normalizedText)) {
        return null;
    }

    const uncertaintyMarkers = [
        'frag google',
        'google weiß',
        'google weiss',
        'frag wikipedia',
        'wikipedia',
        'vermutlich handelt es sich',
        'wahrscheinlich handelt es sich',
        'oder so ähnlich',
        'oder so aehnlich',
    ];

    if (uncertaintyMarkers.some((marker) => normalizedText.includes(marker))) {
        return buildHonestUnknownFallback(normalizedInput, context);
    }

    const bannedMacabreMarkers = [
        'leiche',
        'blut',
        'kadaver',
        'verstümmel',
        'verstuemmel',
        'friedhof',
        'organ',
        'vampir',
        'totes thema',
        'horrorfilm',
    ];

    if (bannedMacabreMarkers.some((marker) => normalizedText.includes(marker))) {
        const blockedMacabre = [
            ...getRecentResponseContents(context),
            ...getRecentExactResponseContents(context),
        ];

        const saferReplies = [
            'Das war selbst für meine Verhältnisse unnötig drüber. Ich bleib lieber bei Witzen statt Gruselkabinett.',
            'Okay, nee. Das kippt gerade von frech zu geschmacklich verunglückt.',
            'Zu makaber. Ich wollte witzig sein, nicht wie ein missglückter Horrorpraktikant klingen.',
            'Das war eher geschmacklich entgleist als lustig. Ich justiere mich kurz zurück auf Niveau.',
        ];

        return pickNonRepeating(saferReplies, blockedMacabre);
    }

    if (looksLikeAcronymQuestion(normalizedInput)) {
        const quotedExpansions = text.match(/"[^"]+"/g) ?? [];
        const hasInventedExpansion = quotedExpansions.length > 0;

        if (
            hasInventedExpansion ||
            normalizedText.includes('steht für') ||
            normalizedText.includes('steht fuer')
        ) {
            return buildHonestUnknownFallback(normalizedInput, context);
        }
    }

    return text.trim();
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

    const sensitiveOverride = getSensitiveExtremismOverride(normalizedInput, context);

    if (sensitiveOverride) {
        return sensitiveOverride;
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

        return postProcessAskAiReply(text, normalizedInput, context);
    } catch (error) {
        console.error('Fehler beim AI-Ask-Fallback:', error);
        return null;
    }
}

export async function generateAiAutotalkComment(
    message: Message,
): Promise<string | null> {
    if (!message.guild) {
        return null;
    }

    const content = message.content.trim();

    if (!content || content.length < 18) {
        return null;
    }

    try {
        console.log('[AUTOTALK-AI] model=%s content=%s', AUTOTALK_AI_MODEL, content);

        const response = await openai.responses.create({
            model: AUTOTALK_AI_MODEL,
            input: [
                {
                    role: 'system',
                    content: `
Du bist TheRealBot, ein witziger Discord-Bot.

Aufgabe:
Kommentiere eine gelesene Nachricht mit genau EINEM kurzen Satz.

Stil:
- trocken
- leicht spöttisch
- eher witzig als böse
- knapp
- pointiert

Regeln:
- genau 1 Satz
- maximal 25 Wörter
- keine Emojis
- kein Rassismus
- keine diskriminierenden Aussagen
- keine Witze, Relativierungen oder Fanboy-Kommentare über Nationalsozialismus, Faschismus, Diktaturen, Kriege oder reales Leid
- kein Gore
- keine makabren Bilder
- keine Leichen-, Blut- oder Horrorwitze
- nicht zu generisch
- keine Fragen am Ende
`,
                },
                {
                    role: 'user',
                    content: `Kommentiere diese Nachricht kurz als TheRealBot:\n"${content}"`,
                },
            ],
            max_output_tokens: 60,
        });

        const text = response.output_text?.trim();

        if (!text) {
            return null;
        }

        return text;
    } catch (error) {
        console.error('Fehler beim AI-Autotalk:', error);
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