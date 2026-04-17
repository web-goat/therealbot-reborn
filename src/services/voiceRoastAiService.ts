import OpenAI from 'openai';
import type {VoiceRoastPlan} from './voiceRoastService.js';

const apiKey = process.env.OPENAI_API_KEY?.trim();

if (!apiKey) {
    throw new Error('OPENAI_API_KEY fehlt');
}

const openai = new OpenAI({apiKey});

const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL?.trim() || 'gpt-4o-mini';

function buildSystemPrompt(): string {
    return `
Du bist TheRealBot, ein sarkastischer, leicht arroganter Discord-Bot.

Dein Stil:
- trocken
- bissig
- kurz
- sozial herablassend, aber nicht entgleist

Regeln:
- genau 1 Satz
- nenne die betroffenen Personen beim Namen
- roaste sie als sozial fragwürdig, armselig oder peinlich
- keine Emojis
- kein Rassismus
- keine diskriminierenden Aussagen
- keine Witze oder Vergleiche über Nationalsozialismus, Faschismus, Diktaturen, Krieg oder reales Leid
- keine Gewaltfantasien
`;
}

function buildUserPrompt(plan: VoiceRoastPlan): string {
    const names = plan.allHumans.map((m) => m.displayName).join(', ');

    if (plan.mode === 'duo') {
        return `
Zwei Personen sitzen gemeinsam in einem Discord-Voice-Channel.

Personen: ${names}

Roaste BEIDE Personen in genau einem Satz.
`;
    }

    const target = plan.targets[0]?.displayName ?? 'Unbekannt';
    const others = plan.allHumans
        .filter((m) => m.displayName !== target)
        .map((m) => m.displayName)
        .join(', ');

    return `
Eine neue Person joint einen Discord-Voice-Channel.

Neue Person: ${target}
Andere im Channel: ${others}

Roaste NUR die neue Person in genau einem Satz.
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
            max_output_tokens: 80,
        });

        const text = response.output_text?.trim();

        if (!text) {
            return fallback(plan);
        }

        const firstSentence = text.split(/[.!?]/)[0];

        return firstSentence.trim() + '.';
    } catch (error) {
        console.error('AI Voice Roast Fehler:', error);
        return fallback(plan);
    }
}

function fallback(plan: VoiceRoastPlan): string {
    if (plan.mode === 'duo') {
        const [a, b] = plan.targets;
        return `${a.displayName} und ${b.displayName} gleichzeitig im Voice ist weniger Gespräch und mehr eine koordinierte Fehlentscheidung.`;
    }

    const [target] = plan.targets;
    return `${target.displayName} joint und verschiebt das Niveau im Channel sofort sichtbar nach unten.`;
}