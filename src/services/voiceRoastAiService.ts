import OpenAI from 'openai';
import type {VoiceRoastPlan} from './voiceRoastService.js';

const apiKey = process.env.OPENAI_API_KEY?.trim();

if (!apiKey) {
    throw new Error('OPENAI_API_KEY fehlt');
}

const openai = new OpenAI({apiKey});

const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL?.trim() || 'gpt-4o-mini';

function normalizeOutput(text: string): string {
    return text
        .replace(/\s+/g, ' ')
        .trim();
}

function looksUsableRoast(text: string): boolean {
    const normalized = normalizeOutput(text).toLowerCase();

    if (!normalized) {
        return false;
    }

    if (normalized.length < 12 || normalized.length > 220) {
        return false;
    }

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

    if (bannedWeirdness.some((word) => normalized.includes(word))) {
        return false;
    }

    return true;
}

function buildSystemPrompt(): string {
    return `
Du bist TheRealBot, ein witziger Discord-Bot.

Dein Stil:
- trocken
- verständlich
- menschlich
- kurze, direkte Sätze
- eher witzig als hart
- wie ein echter Seitenhieb im Gespräch
- leicht arrogant
- spontan
- alltagssprachlich

WICHTIG:
- maximal 1 bis 2 kurze Sätze
- nenne betroffene Personen beim Namen, wenn Namen bekannt sind
- keine langen Erklärungen
- keine Aufsatzsprache
- keine komplizierten Metaphern
- kein Edgelord-Humor
- kein Gore
- keine makabren Bilder
- keine Witze über Leichen, Blut, Tote, Verstümmelung oder Horror-Szenarien

Sicherheitsregeln:
- kein Rassismus
- keine diskriminierenden Aussagen
- keine Witze oder Vergleiche über Nationalsozialismus, Faschismus oder Diktaturen
- keine Witze oder Vergleiche über Krieg, reales Leid oder menschliche Tragödien
- keine Gewaltfantasien

Gute Beispiele:
- "Vincent, stark. Du gehst freiwillig mit Kleaver in einen Voice. Ich respektiere den Kontrollverlust."
- "Kleaver ist jetzt auch da. Genau das hat hier noch gefehlt: zusätzliche Unruhe."
- "Okay, Schweigen. Selbst eure Antwort hat sich geschämt."
- "Vincent, das macht es schlimmer. Unfälle kann man wenigstens entschuldigen."
- "Stark, keiner übernimmt Verantwortung. Genau mein Niveau hier."

Schlechte Beispiele:
- "Vincent und Kleaver bilden ein Sammelbecken sozialer Dysfunktion."
- "Dies ist eine koordinierte Fehlentscheidung mit auditiver Komponente."
- "Ihr verkörpert gemeinsam ein semantisches Scheitern."
- "Das klingt wie eine Leiche mit WLAN."
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
Roaste BEIDE Personen in 1 bis 2 kurzen, sehr gut verständlichen Sätzen.
Es soll klingen wie ein spontaner, lustiger Seitenhieb von einem arroganten Bot.
Mehr Witz als Härte.
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
Roaste NUR die neu gejointe Person in 1 bis 2 kurzen, sehr gut verständlichen Sätzen.
Es soll klingen wie ein spontaner, lustiger Seitenhieb von einem arroganten Bot.
Mehr Witz als Härte.
`;
}

function buildReactionPrompt(input: {
    plan: VoiceRoastPlan;
    introText: string;
    speakerName: string | null;
    heardText: string;
}): string {
    const {plan, introText, speakerName, heardText} = input;
    const allNames = plan.allHumans.map((m) => m.displayName).join(', ');
    const targetNames = plan.targets.map((m) => m.displayName).join(', ');

    return `
Situation:
TheRealBot ist in einen Discord-Voice-Channel gekommen und hat gerade eine provokante Frage gestellt.

Personen im Channel:
${allNames}

Zielpersonen:
${targetNames}

Bot-Frage:
"${introText}"

Gehörte Antwort von ${speakerName ?? 'niemandem'}:
"${heardText || 'keine verständliche Antwort'}"

Aufgabe:
Reagiere jetzt mit genau EINEM kurzen, spontanen Konter.
Wenn jemand geantwortet hat, beziehe dich direkt auf diese Antwort.
Wenn niemand verständlich geantwortet hat, mach dich über das Schweigen oder die awkward Situation lustig.
Nenne ${speakerName ?? 'eine passende Person'} beim Namen, wenn es natürlich klingt.
Der Satz muss gesprochen gut funktionieren.
Keine Erklärung.
Keine Anführungszeichen.
`;
}

function fallback(plan: VoiceRoastPlan): string {
    if (plan.mode === 'duo') {
        const [a, b] = plan.targets;
        const nameA = a?.displayName ?? 'Unbekannt';
        const nameB = b?.displayName ?? 'Unbekannt';

        const lines = [
            `${nameA}, ${nameB}. Ihr zwei allein im Voice. Das ist schon fast traurig organisiert.`,
            `${nameA} und ${nameB} zusammen im Call. Ich sehe, Einsamkeit wird jetzt im Team bearbeitet.`,
            `${nameA}, ${nameB}. Ihr klingt nach einer Konstellation, bei der direkt alle Warnlampen angehen.`,
            `${nameA} und ${nameB} gleichzeitig im Voice. Das ist weniger Gespräch und mehr ein Unfall mit Anlauf.`,
        ];

        return lines[Math.floor(Math.random() * lines.length)];
    }

    const [target] = plan.targets;
    const name = target?.displayName ?? 'Unbekannt';

    const lines = [
        `${name} joint rein und sofort wird alles ein kleines Stück unnötiger.`,
        `${name} ist jetzt auch da. Genau das hat hier noch gefehlt: noch mehr fragwürdige Energie.`,
        `${name} kommt dazu und der Channel klingt direkt nach einer schlechteren Entscheidung.`,
        `${name} ist drin. Das Niveau hat sich gerade hörbar verabschiedet.`,
    ];

    return lines[Math.floor(Math.random() * lines.length)];
}

function reactionFallback(input: {
    plan: VoiceRoastPlan;
    speakerName: string | null;
    heardText: string;
}): string {
    const {plan, speakerName, heardText} = input;

    if (!heardText.trim()) {
        const names = plan.targets.map((m) => m.displayName).join(' und ');

        const lines = [
            `${names}, stark. Selbst eure Stille klingt überfordert.`,
            `${names}, keine Antwort ist auch eine Antwort. Leider keine gute.`,
            `Okay, Schweigen. Selbst eure Ausreden haben den Channel verlassen.`,
        ];

        return lines[Math.floor(Math.random() * lines.length)];
    }

    const name = speakerName ?? plan.targets[0]?.displayName ?? 'Unbekannt';

    const lines = [
        `${name}, danke. Das hat meine Erwartungen unterboten.`,
        `${name}, mutig geantwortet. Inhaltlich trotzdem eher Parkplatz.`,
        `${name}, das klang selbstbewusst. Nicht richtig, aber selbstbewusst.`,
    ];

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
    introText: string;
    speakerName: string | null;
    heardText: string;
}): Promise<string> {
    try {
        const cleaned = await generateText(buildReactionPrompt(input), 70);

        if (!looksUsableRoast(cleaned)) {
            return reactionFallback(input);
        }

        return cleaned;
    } catch (error) {
        console.error('AI Voice Reaction Fehler:', error);
        return reactionFallback(input);
    }
}