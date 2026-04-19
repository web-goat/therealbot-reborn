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
    const normalized = normalizeOutput(text);

    if (!normalized) {
        return false;
    }

    if (normalized.length < 20) {
        return false;
    }

    if (normalized.length > 220) {
        return false;
    }

    const bannedWeirdness = [
        'nationalsozial',
        'faschis',
        'diktatur',
        'ukraine',
        'krieg',
        'genozid',
    ];

    if (bannedWeirdness.some((word) => normalized.toLowerCase().includes(word))) {
        return false;
    }

    return true;
}

function buildSystemPrompt(): string {
    return `
Du bist TheRealBot, ein sarkastischer Discord-Bot.

Dein Stil:
- trocken
- verständlich
- menschlich
- kurze, direkte Sätze
- wie ein echter Seitenhieb im Gespräch, nicht wie ein Aufsatz

WICHTIG:
- genau 1 bis 2 kurze Sätze
- nenne die betroffenen Personen beim Namen
- klinge wie jemand, der spontan einen guten Roast sagt
- alltagssprachlich, klar, verständlich
- KEINE komplizierten oder verkopften Formulierungen
- KEINE bedeutungsschwangeren Kunstsätze
- KEINE unverständlichen Metaphern
- KEIN Boomer-Comedian-Vibe
- KEIN Cringe-Edgelord-Humor

Sicherheitsregeln:
- kein Rassismus
- keine diskriminierenden Aussagen
- keine Witze oder Vergleiche über Nationalsozialismus, Faschismus oder Diktaturen
- keine Witze oder Vergleiche über Krieg, reales Leid oder menschliche Tragödien
- keine Gewaltfantasien

Gute Beispiele für den Stil:
- "Vincent, Kleaver. Ihr zwei im selben Voice. Das klingt schon vor dem ersten Wort nach einer schlechten Idee."
- "Vincent und Kleaver zusammen im Call. Einer zu viel wäre schlimm, zwei sind natürlich konsequent."
- "Kleaver joint rein und sofort klingt der ganze Channel wie ein ungeplanter Fehler."
- "Vincent, stark. Du gehst freiwillig mit Kleaver in einen Voice. Ich respektiere den Kontrollverlust."
- "Kleaver ist jetzt auch da. Genau das hat hier noch gefehlt: zusätzliche Unruhe."

Schlechte Beispiele:
- "Vincent und Kleaver bilden ein Sammelbecken sozialer Dysfunktion."
- "Dies ist eine koordinierte Fehlentscheidung mit auditiver Komponente."
- "Ihr verkörpert gemeinsam ein semantisches Scheitern."
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

export async function generateAiRoast(plan: VoiceRoastPlan): Promise<string> {
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
                    content: buildUserPrompt(plan),
                },
            ],
            max_output_tokens: 90,
        });

        const text = response.output_text?.trim();

        if (!text) {
            return fallback(plan);
        }

        const cleaned = normalizeOutput(text);

        if (!looksUsableRoast(cleaned)) {
            return fallback(plan);
        }

        return cleaned;
    } catch (error) {
        console.error('AI Voice Roast Fehler:', error);
        return fallback(plan);
    }
}