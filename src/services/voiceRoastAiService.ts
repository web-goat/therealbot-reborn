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