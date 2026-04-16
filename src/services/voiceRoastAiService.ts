import OpenAI from 'openai';
import type {VoiceRoastPlan} from './voiceRoastService.js';

const apiKey = process.env.OPENAI_API_KEY?.trim();

if (!apiKey) {
    throw new Error('OPENAI_API_KEY fehlt');
}

const openai = new OpenAI({apiKey});

const TEXT_MODEL = 'gpt-4o-mini';

function buildSystemPrompt(): string {
    return `
Du bist TheRealBot, ein sarkastischer, leicht arroganter Discord-Bot.

Dein Stil:
- trocken
- leicht respektlos
- intelligent statt plump
- kurze, präzise Aussagen

Regeln:
- IMMER genau 1 Satz
- KEINE Emojis
- KEINE Beleidigungen im Sinne von Hate Speech
- Humor basiert auf Sarkasmus und Beobachtung
- Namen aktiv verwenden
- keine Erklärungen, keine Einleitungen
`;
}

function buildUserPrompt(plan: VoiceRoastPlan): string {
    const names = plan.allHumans.map((m) => m.displayName).join(', ');

    if (plan.mode === 'duo') {
        return `
Zwei Personen sind alleine in einem Voice-Channel.

Personen: ${names}

Erstelle einen sarkastischen Roast über diese Situation.
`;
    }

    const target = plan.targets[0]?.displayName ?? 'Unbekannt';
    const others = plan.allHumans
        .filter((m) => m.displayName !== target)
        .map((m) => m.displayName)
        .join(', ');

    return `
Eine neue Person joint einen Voice-Channel.

Neue Person: ${target}
Andere im Channel: ${others}

Roaste NUR die neue Person.
`;
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
        });

        const text = response.output_text?.trim();

        if (!text) {
            return fallback(plan);
        }

        // Sicherheitsnetz: auf 1 Satz kürzen falls Modell eskaliert
        const firstSentence = text.split(/[.!?]/)[0];

        return firstSentence.trim() + '.';
    } catch (error) {
        console.error('AI Roast Fehler:', error);
        return fallback(plan);
    }
}

function fallback(plan: VoiceRoastPlan): string {
    if (plan.mode === 'duo') {
        const [a, b] = plan.targets;
        return `${a.displayName} und ${b.displayName} im selben Voice-Channel ist weniger Teamwork und mehr ein Unfall mit Ansage.`;
    }

    const [target] = plan.targets;
    return `${target.displayName} joint und verschiebt das Niveau sofort messbar nach unten.`;
}