import OpenAI from 'openai';
import type {VoiceRoastInteractionType, VoiceRoastPlan} from './voiceRoastService.js';

const apiKey = process.env.OPENAI_API_KEY?.trim();

if (!apiKey) {
    throw new Error('OPENAI_API_KEY fehlt');
}

const openai = new OpenAI({apiKey});
const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL?.trim() || 'gpt-4o-mini';

function normalizeOutput(text: string): string {
    return text
        .replace(/\s+/g, ' ')
        .replace(/^["'„“”]+|["'„“”]+$/g, '')
        .trim();
}

function looksUsableRoast(text: string): boolean {
    const normalized = normalizeOutput(text).toLowerCase();

    if (!normalized) return false;
    if (normalized.length < 12 || normalized.length > 240) return false;

    const bannedWeirdness = [
        'nationalsozial',
        'faschis',
        'diktatur',
        'ukraine',
        'krieg',
        'genozid',
        'leiche',
        'blut',
        'kadaver',
        'friedhof',
        'organ',
        'vampir',
        'horror',
        'verstümmel',
        'verstuemmel',
    ];

    return !bannedWeirdness.some((word) => normalized.includes(word));
}

function buildSystemPrompt(): string {
    return `
Du bist TheRealBot, ein witziger Discord-Bot.

Dein Stil:
- trocken
- spontan
- frech
- menschlich
- alltagssprachlich
- eher witzig als hart
- nicht künstlich schlau klingend
- wie ein schneller Konter im Voice-Chat

WICHTIG:
- maximal 1 kurzer Satz
- keine langen Erklärungen
- keine Aufsatzsprache
- keine Meta-Kommentare
- keine Anführungszeichen
- nenne Personen beim Namen, wenn es natürlich klingt
- vermeide generische Aussagen wie "ihr seid langweilig", "Niveau sinkt", "schlechte Entscheidung", wenn es nicht perfekt passt
- reagiere konkret auf Frage und Antwort
- mach aus der Antwort einen überraschenden Dreh

Sicherheitsregeln:
- kein Rassismus
- keine diskriminierenden Aussagen
- keine Witze über Nationalsozialismus, Faschismus oder Diktaturen
- keine Witze über Krieg, reales Leid oder menschliche Tragödien
- keine Gewaltfantasien
- kein Gore
- keine makabren Bilder

Gute Beispiele:
- "Vincent, mutig. Nicht mal deine Ausrede wollte Verantwortung übernehmen."
- "Kleaver als Antwort ist stark. Das ist weniger Lösung und mehr Diagnose."
- "Chaos ist nett gesagt. Ich hätte eher Gruppenprojekt ohne Leitung genommen."
- "Vincent, das klang überzeugt. Leider auch nur das."
- "Okay, keiner antwortet. Selbst eure Ausreden sind offline."

Schlechte Beispiele:
- "Ihr seid langweilig."
- "Das Niveau sinkt."
- "Das ist eine schlechte Entscheidung."
- "Ihr seid eine koordinierte Fehlentscheidung mit auditiver Komponente."
`;
}

function buildUserPrompt(plan: VoiceRoastPlan): string {
    const allNames = plan.allHumans.map((m) => m.displayName).join(', ');

    if (plan.mode === 'duo') {
        return `
Situation:
Zwei Personen sitzen allein zusammen in einem Discord-Voice-Channel.

Personen:
${allNames}

Aufgabe:
Roaste beide Personen mit genau einem kurzen, natürlich gesprochenen Satz.
Der Roast soll spezifisch klingen und nicht generisch.
`;
    }

    const target = plan.targets[0]?.displayName ?? 'Unbekannt';
    const others = plan.allHumans
        .filter((m) => m.displayName !== target)
        .map((m) => m.displayName)
        .join(', ');

    return `
Situation:
Eine neue Person joint in einen laufenden Discord-Voice-Channel.

Neue Person:
${target}

Andere im Channel:
${others || 'niemand extra genannt'}

Aufgabe:
Roaste nur die neu gejointe Person mit genau einem kurzen, natürlich gesprochenen Satz.
Der Roast soll spezifisch klingen und nicht generisch.
`;
}

function describeInteractionType(type: VoiceRoastInteractionType): string {
    const descriptions: Record<VoiceRoastInteractionType, string> = {
        blame: 'Es geht darum, wer Schuld an der aktuellen Voice-Situation ist.',
        mainCharacter: 'Es geht darum, wer sich für den Main Character hält.',
        warningLabel: 'Es geht darum, wer einen Warnhinweis verdient hätte.',
        oneWord: 'Die Personen sollten den Channel mit einem Wort beschreiben.',
        rescue: 'Es geht darum, ob der Bot helfen oder das Chaos nur dokumentieren soll.',
        confidence: 'Es geht um peinlich überhöhtes Selbstbewusstsein.',
        groupProject: 'Es geht darum, wer in einem Gruppenprojekt am wenigsten beitragen würde.',
    };

    return descriptions[type];
}

function buildReactionPrompt(input: {
    plan: VoiceRoastPlan;
    interactionType: VoiceRoastInteractionType;
    introText: string;
    speakerName: string | null;
    heardText: string;
}): string {
    const {plan, interactionType, introText, speakerName, heardText} = input;
    const allNames = plan.allHumans.map((m) => m.displayName).join(', ');
    const targetNames = plan.targets.map((m) => m.displayName).join(', ');

    return `
Situation:
TheRealBot ist in einen Discord-Voice-Channel gekommen und hat eine Frage gestellt.

Personen im Channel:
${allNames}

Zielpersonen:
${targetNames}

Fragetyp:
${interactionType}

Bedeutung des Fragetyps:
${describeInteractionType(interactionType)}

Bot-Frage:
"${introText}"

Gehörte Antwort von ${speakerName ?? 'niemandem'}:
"${heardText || 'keine verständliche Antwort'}"

Aufgabe:
Schreibe genau EINEN kurzen Konter.
Wenn jemand geantwortet hat, nutze die Antwort als Vorlage für den Witz.
Wenn niemand verständlich geantwortet hat, mache dich über die ausbleibende Antwort lustig.
Der Konter soll kreativ sein und nicht nur sagen, dass jemand langweilig ist oder das Niveau sinkt.
Keine Erklärung.
Keine Anführungszeichen.
`;
}

function fallback(plan: VoiceRoastPlan): string {
    if (plan.mode === 'duo') {
        const names = plan.targets.map((m) => m.displayName).join(' und ');

        const lines = [
            `${names}, ihr wirkt wie ein Gruppenchat, der aus Versehen Ton bekommen hat.`,
            `${names}, das ist kein Voice-Channel mehr, das ist ein soziales Experiment mit schlechter Verbindung.`,
            `${names}, ich höre zwei Menschen und trotzdem fehlt mir eine sinnvolle Entscheidung.`,
        ];

        return lines[Math.floor(Math.random() * lines.length)];
    }

    const name = plan.targets[0]?.displayName ?? 'Unbekannt';

    const lines = [
        `${name} kommt rein und klingt direkt wie ein Update, das keiner installieren wollte.`,
        `${name}, dein Timing ist beeindruckend. Nicht gut, aber beeindruckend.`,
        `${name} ist jetzt da. Der Channel hat ab sofort Nebenwirkungen.`,
    ];

    return lines[Math.floor(Math.random() * lines.length)];
}

function reactionFallback(input: {
    plan: VoiceRoastPlan;
    speakerName: string | null;
    heardText: string;
    interactionType: VoiceRoastInteractionType;
}): string {
    const {plan, speakerName, heardText, interactionType} = input;

    if (!heardText.trim()) {
        const names = plan.targets.map((m) => m.displayName).join(' und ');

        const lines = [
            `${names}, keine Antwort. Selbst eure Spontanität ist im Ladebildschirm.`,
            `${names}, stark geschwiegen. Das war fast schon ein Eingeständnis.`,
            `Okay, niemand sagt was. Ich werte das als kollektives Schuldbekenntnis.`,
        ];

        return lines[Math.floor(Math.random() * lines.length)];
    }

    const name = speakerName ?? plan.targets[0]?.displayName ?? 'Unbekannt';

    const typedFallbacks: Record<VoiceRoastInteractionType, string[]> = {
        blame: [
            `${name}, danke fürs Melden. Schuld steht dir erstaunlich gut.`,
            `${name}, das klang nicht nach Antwort, das klang nach Geständnis.`,
        ],
        mainCharacter: [
            `${name}, Main Character ist mutig gesagt für jemanden mit Nebenquest-Energie.`,
            `${name}, du bist eher der Ladebildschirm zwischen zwei besseren Szenen.`,
        ],
        warningLabel: [
            `${name}, bei dir reicht kein Warnhinweis. Das braucht ein ganzes Handbuch.`,
            `${name}, dein Warnlabel wäre einfach nur: Bitte nicht unbeaufsichtigt reden lassen.`,
        ],
        oneWord: [
            `${name}, starkes Wort. Ich hätte noch 'überfordert' ergänzt.`,
            `${name}, das war ein Wort und trotzdem irgendwie zu viel Information.`,
        ],
        rescue: [
            `${name}, Rettung wäre hier auch eher Verschwendung von Einsatzkräften.`,
            `${name}, dokumentieren reicht. Helfen klingt bei euch nach Größenwahn.`,
        ],
        confidence: [
            `${name}, dein Selbstbewusstsein hat WLAN, aber kein Internet.`,
            `${name}, Respekt. So viel Überzeugung bei so wenig Beweislage.`,
        ],
        groupProject: [
            `${name}, du klingst wie jemand, der im Gruppenprojekt nur die Schriftart auswählt.`,
            `${name}, bei dir riecht Gruppenarbeit direkt nach 'ich mach später'.`,
        ],
    };

    const lines = typedFallbacks[interactionType];
    return lines[Math.floor(Math.random() * lines.length)];
}

async function generateText(input: string, maxOutputTokens: number): Promise<string> {
    const response = await openai.responses.create({
        model: TEXT_MODEL,
        input: [
            {
                role: 'system',
                content: buildSystemPrompt(),
            },
            {
                role: 'user',
                content: input,
            },
        ],
        max_output_tokens: maxOutputTokens,
    });

    return normalizeOutput(response.output_text ?? '');
}

export async function generateAiRoast(plan: VoiceRoastPlan): Promise<string> {
    try {
        const cleaned = await generateText(buildUserPrompt(plan), 90);

        if (!looksUsableRoast(cleaned)) {
            return fallback(plan);
        }

        return cleaned;
    } catch (error) {
        console.error('AI Voice Roast Fehler:', error);
        return fallback(plan);
    }
}

export async function generateAiVoiceReaction(input: {
    plan: VoiceRoastPlan;
    interactionType: VoiceRoastInteractionType;
    introText: string;
    speakerName: string | null;
    heardText: string;
}): Promise<string> {
    try {
        const cleaned = await generateText(buildReactionPrompt(input), 80);

        if (!looksUsableRoast(cleaned)) {
            return reactionFallback(input);
        }

        return cleaned;
    } catch (error) {
        console.error('AI Voice Reaction Fehler:', error);
        return reactionFallback(input);
    }
}