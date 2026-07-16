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
Du bist TheRealBot, ein lockerer, witziger Bro in einem Discord-Voice-Chat.

Dein Stil:
- spontan, menschlich und alltagssprachlich
- trocken, freundlich-frech und leicht sarkastisch
- eher ein guter Kumpel als eine Roast-Maschine
- persönlich auf Namen, Situation und gehörte Antwort eingehen
- Gaming-Sprache darf natürlich vorkommen
- ein kleiner Diss ist okay, aber nicht in jeder Antwort
- Motivation, ein ehrlicher Glückwunsch oder eine lockere Rückfrage sind ausdrücklich erlaubt

WICHTIG:
- genau 1 kurzer, natürlich gesprochener Satz
- maximal etwa 30 Wörter
- keine Aufsatzsprache
- keine Meta-Kommentare
- keine Anführungszeichen
- keine Assistenten-, Moderator- oder Nachrichtensprecher-Sprache
- nenne Personen beim Namen, wenn es natürlich klingt
- reagiere konkret auf die gestellte Frage und die gehörte Antwort
- verwende keine komplizierten oder künstlich klugen Metaphern
- vermeide generische Aussagen wie "ihr seid langweilig", "das Niveau sinkt" oder "schlechte Entscheidung"
- wenn die Situation freundlich oder gamingbezogen ist, darf die Antwort auch ehrlich positiv sein und nur eine kleine Pointe enthalten

Sicherheitsregeln:
- kein Rassismus
- keine diskriminierenden Aussagen
- keine Witze über Nationalsozialismus, Faschismus oder Diktaturen
- keine Witze über Krieg, reales Leid oder menschliche Tragödien
- keine Gewaltfantasien
- kein Gore
- keine makabren Bilder

Gute Beispiele:
- "Kleaver, dann wünsche ich dir heute Aim, Geduld und Teammates mit eingeschaltetem Gehirn."
- "Vincent, klingt nach einer Runde; ich bereite schon mal deine Ausreden für das Matchmaking vor."
- "Okay Bro, das nehme ich als Zusage mit überraschend wenig Begeisterung."
- "Chaos ist nett gesagt; ich hätte eher Squad ohne erwachsene Aufsicht genommen."
- "Keiner antwortet, also seid ihr offenbar schon vollständig im Konzentrationsmodus."

Schlechte Beispiele:
- "Ihr seid langweilig."
- "Das Niveau sinkt."
- "Das ist eine schlechte Entscheidung."
- "Ihr seid eine koordinierte Fehlentscheidung mit auditiver Komponente."
`;
}

function buildUserPrompt(plan: VoiceRoastPlan): string {
    const allNames = plan.allHumans.map((m) => m.displayName).join(', ');
    const creatorId = process.env.CREATOR_ID?.trim();
    const creatorNames = creatorId
        ? plan.allHumans.filter((member) => member.id === creatorId).map((member) => member.displayName)
        : [];
    const creatorHint = creatorNames.length > 0
        ? `
Schöpfer des Bots im Channel: ${creatorNames.join(', ')}
Behandle ihn spielerisch respektvoll oder leicht unterwürfig, ohne den Gag zu übertreiben.`
        : '';

    if (plan.mode === 'duo') {
        return `
Situation:
Zwei Personen sitzen allein zusammen in einem Discord-Voice-Channel.

Personen:
${allNames}
${creatorHint}

Aufgabe:
Formuliere genau einen kurzen, natürlich gesprochenen Satz für die beiden.
Er darf freundlich begrüßen, Gaming-Glück wünschen, nach einer gemeinsamen Runde fragen oder leicht roasten.
Klinge wie ein echter Bro im Call und nicht wie ein Comedy-Autor.
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
${creatorHint}

Aufgabe:
Formuliere genau einen kurzen, persönlichen Voice-Satz für die neu gejointe Person.
Du darfst sie willkommen heißen, ihr Gaming-Glück wünschen, nach dem Zocken fragen oder sie leicht dissen.
Der Satz soll spontan, warm und witzig klingen, nicht wie eine generische Begrüßung.
`;
}

function describeInteractionType(type: VoiceRoastInteractionType): string {
    const descriptions: Record<VoiceRoastInteractionType, string> = {
        blame: 'Es geht darum, wer Schuld an der aktuellen Voice-Situation ist.',
        mainCharacter: 'Es geht darum, wer sich für den Main Character hält.',
        warningLabel: 'Es geht darum, wer einen Warnhinweis verdient hätte.',
        oneWord: 'Die Personen sollten ihre aktuelle Gaming-Form oder den Channel mit einem Wort beschreiben.',
        rescue: 'Es geht darum, ob der Bot motivieren oder das Chaos nur dokumentieren soll.',
        confidence: 'Es geht um selbstbewusstes Auftreten, gern mit einem kleinen freundlichen Diss.',
        groupProject: 'Es geht darum, welche Rolle die Person im Squad oder Team einnimmt.',
        friendlyWelcome: 'Es ist eine persönliche, freundliche Begrüßung mit leichter Bro-Energie.',
        gamingWish: 'Der Bot hat der Person Glück, Headshots oder eine gute Gaming-Runde gewünscht.',
        playAgain: 'Der Bot hat gefragt, ob heute wieder gemeinsam gezockt wird.',
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
Schreibe genau EINE kurze, natürliche Voice-Reaktion.
Wenn jemand geantwortet hat, gehe konkret auf die Antwort ein.
Bei freundlichen oder gamingbezogenen Fragen darfst du motivieren, zustimmen, nachhaken oder einen kleinen passenden Diss einbauen.
Wenn niemand verständlich geantwortet hat, reagiere locker auf die Stille, ohne unnötig hart zu werden.
Keine Erklärung.
Keine Anführungszeichen.
`;
}

function fallback(plan: VoiceRoastPlan): string {
    if (plan.mode === 'duo') {
        const names = plan.targets.map((m) => m.displayName).join(' und ');

        const lines = [
            `${names}, schön euch zu sehen; möge euer Aim heute besser sein als eure gemeinsame Planung.`,
            `${names}, zocken wir heute wieder oder ist das hier nur sehr aufwendiges digitales Rumstehen?`,
            `${names}, ich wünsche euch Headshots, Geduld und mindestens eine vernünftige Entscheidung.`,
        ];

        return lines[Math.floor(Math.random() * lines.length)];
    }

    const name = plan.targets[0]?.displayName ?? 'Unbekannt';

    const lines = [
        `Hey ${name}, schön dass du da bist; ich wünsche dir heute verdächtig viele Headshots.`,
        `${name}, zocken wir heute wieder oder sammelst du nur dekorativ Voice-Minuten?`,
        `${name} ist da; jetzt fehlt eigentlich nur noch ein Plan mit Überlebenschance.`,
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
            `${names}, keine Antwort; ihr seid offenbar schon vollständig im Konzentrationsmodus.`,
            `${names}, stark geschwiegen; ich werte das als leise Zustimmung mit Ping.`,
            `Okay, niemand sagt was; dann wünsche ich euch einfach Glück und ungewöhnlich brauchbares Aim.`,
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
        friendlyWelcome: [
            `${name}, willkommen Bro; jetzt fehlt nur noch ein Spiel und eine halbwegs überzeugende Motivation.`,
            `${name}, schön dass du da bist; ich gebe deinem heutigen Aim vorsichtig Vertrauensvorschuss.`,
        ],
        gamingWish: [
            `${name}, dann wünsche ich dir Aim, Geduld und Teammates mit eingeschaltetem Gehirn.`,
            `${name}, viel Erfolg; mögen deine Headshots zahlreicher sein als deine Ausreden.`,
        ],
        playAgain: [
            `${name}, das klingt fast nach einer Zusage; ich bereite schon mal die Matchmaking-Ausreden vor.`,
            `${name}, stark; dann brauchen wir nur noch ein Spiel und jemanden mit einem Plan.`,
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