import type { GuildMember, Message } from 'discord.js';
import { askCategoryResponses } from './categoryResponses.js';
import { goodbyeResponses, greetingResponses, yesNoResponses } from './responses.js';
import type { NormalizedAskInput } from './normalizeInput.js';
import type { AskResult } from './types.js';

function pickRandom<T>(items: readonly T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

function reply(content: string): AskResult {
    return { type: 'reply', content };
}

function forward(commandName: string): AskResult {
    return { type: 'forward', commandName };
}

function getMentionedMember(message: Message): GuildMember | null {
    return message.mentions.members?.first() ?? null;
}

function normalizeVerb(value: string): string {
    return value.trim().toLowerCase();
}

function lowerFirst(value: string): string {
    if (!value) return value;
    return value.charAt(0).toLowerCase() + value.slice(1);
}

function getUserRating(member: GuildMember): string {
    const opinions = [
        `${member} ist überraschend okay. Fast verdächtig okay.`,
        `${member} wirkt wie jemand, der im Supermarkt aktiv Radler sucht.`,
        `${member} ist definitiv einer der Menschen aller Zeiten.`,
        `${member} hat Potenzial. Leider hauptsächlich zur Eskalation.`,
        `${member} ist stabil. Leider mehr im Sinne von dauerhaft seltsam.`,
        `${member} ist gar nicht so schlimm. Also gemessen an den Umständen.`,
        `${member} hat eine Aura zwischen Hauptcharakter und Warnhinweis.`,
        `${member} ist charakterlich ein Glücksspiel mit schlechter Quote.`,
        `${member} ist schon okay. Würde ich aber trotzdem beobachten.`,
        `${member} ist besser als manche hier. Die Messlatte liegt aber am Boden.`,
    ];

    return pickRandom(opinions);
}

function getUserRoast(member: GuildMember): string {
    const roasts = [
        `${member} ist wie schlechtes WLAN: da, aber bringt nichts.`,
        `${member} hat die Energie von einer PowerPoint mit 94 Folien und keinem Inhalt.`,
        `${member} ist der Beweis, dass Anwesenheit keine Qualität garantiert.`,
        `${member} wirkt wie jemand, der beim Denken Ladezeiten hat.`,
        `${member} ist nicht nutzlos. Man kann immer noch ein schlechtes Beispiel an ${member} nehmen.`,
        `${member} strahlt das Selbstbewusstsein eines Druckers mit Papierstau aus.`,
        `${member} ist wie Montagmorgen in Menschform.`,
        `${member} hat das Charisma einer Excel-Fehlermeldung.`,
        `${member} ist schon besonders. Leider auf eine sehr vermeidbare Art.`,
        `${member} ist der Grund, warum Warnhinweise erfunden wurden.`,
    ];

    return pickRandom(roasts);
}

function getVerbReaction(member: GuildMember, verb: string): string {
    const safeVerb = normalizeVerb(verb);

    const positiveVerbMap: Record<string, string[]> = {
        küssen: [
            `${member} würde ich vielleicht küssen. Aber nur, wenn der Pegel stimmt.`,
            `${member} küssen? Ich habe Standards. Aber auch schlechte Tage.`,
            `${member} würde ich höchstens aus wissenschaftlichem Interesse küssen.`,
        ],
        umarmen: [
            `${member} würde ich umarmen. Kurz. Widerwillig. Aber vielleicht.`,
            `${member} hat eine Umarmung eher nötig als verdient.`,
            `${member} könnte eine Umarmung vertragen. Die Persönlichkeit eher nicht.`,
        ],
        loben: [
            `${member} lobe ich nur, wenn die Sonne rückwärts aufgeht.`,
            `${member} hat Lob verdient. Theoretisch. Irgendwann. Vielleicht.`,
            `${member} bekommt heute ausnahmsweise ein Lob. Nicht übertreiben damit.`,
        ],
        beleidigen: [
            `${member} beleidigen? Das übernimmt oft schon die Realität.`,
            `${member} könnte ich beleidigen, aber dann hätte ich Mitleid mit der Sprache.`,
            `${member} zu beleidigen ist wie Wasser ins Meer tragen. Viel Aufwand, wenig Effekt.`,
        ],
        roasten: [
            getUserRoast(member),
            `${member} roaste ich nicht. Ich dokumentiere nur die offensichtlichen Mängel.`,
            `${member} ist kein Roast-Ziel. ${member} ist ein Langzeitprojekt.`,
        ],
        heiraten: [
            `${member} heiraten? Ich bin verrückt, aber nicht steuerlich.`,
            `${member} heiraten würde ich nur mit Vollnarkose und getrennten Konten.`,
            `${member} ist eher Kategorie Chaos als Ehefähigkeit.`,
        ],
        anrufen: [
            `${member} würde ich nicht mal aus Versehen anrufen.`,
            `${member} anrufen? Ich hab nicht mal so viel Akku.`,
            `${member} würde ich höchstens anrufen, um direkt wieder aufzulegen.`,
        ],
        nerven: [
            `${member} nerven? Das macht ${member} vermutlich schon selbst am effizientesten.`,
            `${member} zu nerven wäre überflüssig. Das Leben hat da Vorsprung.`,
            `${member} verdient es genervt zu werden, aber ich respektiere meine Zeit.`,
        ],
        bewerten: [
            `${member} ist eine solide 4 von 10 mit Tendenz zur organisatorischen Katastrophe.`,
            `${member} bekommt von mir die Wertung: vorhanden.`,
            `${member} ist bewertbar, aber nur mit viel Fantasie.`,
        ],
        saufen: [
            `${member} und ich zusammen saufen? Das eskaliert schneller als dein letzter Abend.`,
            `${member} kann mit mir saufen. Aber ob ${member} mithalten kann, ist die andere Frage.`,
            `${member} sollte lieber Wasser trinken. Zu deinem eigenen Schutz.`,
        ],

        trinken: [
            `${member} darf mit mir trinken. Aber ich übernehme keine Verantwortung.`,
            `${member} trinken sehen ist vermutlich schon Entertainment genug.`,
            `${member} sollte erstmal lernen, wie man ein Glas richtig hält.`,
        ],

        feiern: [
            `${member} feiern? Wird wild. Für mich. Für ${member} eher ein medizinischer Notfall.`,
            `${member} ist eher Kategorie Zuschauer als Partylöwe.`,
            `${member} feiern lassen ist mutig. Ich respektiere das Risiko.`,
        ],

        lieben: [
            `${member} lieben? Ich habe Gefühle, aber auch Grenzen.`,
            `${member} ist liebenswert. Für irgendwen. Bestimmt.`,
            `${member} zu lieben wäre ein Abenteuer mit fragwürdigem Ausgang.`,
        ],

        hassen: [
            `${member} hassen? Das erledigt ${member} wahrscheinlich schon selbst.`,
            `${member} hat sich Hass hart erarbeitet. Respekt dafür.`,
            `${member} ist nicht wichtig genug, um ihn aktiv zu hassen.`,
        ],

        respektieren: [
            `${member} respektiere ich. Minimal. Aber es zählt.`,
            `${member} bekommt Respekt, wenn ${member} ihn sich verdient. Also nie.`,
            `${member} wird respektiert. Auf Probe.`,
        ],

        ignorieren: [
            `${member} ignoriere ich professionell.`,
            `${member} ist leicht zu ignorieren. Talent vorhanden.`,
            `${member} verschwindet in der Bedeutungslosigkeit erstaunlich gut.`,
        ],

        verprügeln: [
            `${member} verprügeln? Ich arbeite lieber mit Worten. Die tun mehr weh.`,
            `${member} hat Glück, dass ich nur virtuell existiere.`,
            `${member} wird schon genug vom Leben verprügelt.`,
        ],

        blockieren: [
            `${member} blockieren wäre Selbstschutz.`,
            `${member} ist ein klarer Fall für die Ignore-Liste.`,
            `${member} blockieren? Verständliche Entscheidung.`,
        ],

        anschreiben: [
            `${member} anschreiben? Ich habe Würde.`,
            `${member} anschreiben würde ich nur aus Langeweile.`,
            `${member} ist keine Nachricht wert. Und das will was heißen.`,
        ],

        treffen: [
            `${member} treffen? Nur in gut beleuchteten, öffentlichen Räumen.`,
            `${member} treffen klingt nach Risikoanalyse.`,
            `${member} würde ich treffen. Einmal. Zum Lernen.`,
        ],

        daten: [
            `${member} daten? Ich bin nicht lebensmüde.`,
            `${member} daten würde ich nur mit Notfallkontakt.`,
            `${member} ist eher Kategorie „Erfahrung“ als „Beziehung“.`,
        ],

        bewundern: [
            `${member} bewundern? Ich bewundere eher die Geduld anderer mit ${member}.`,
            `${member} hat bewundernswerte Eigenschaften. Ich suche sie noch.`,
            `${member} wird bewundert. Von sich selbst wahrscheinlich.`,
        ],

        vertrauen: [
            `${member} vertrauen? Mutig. Sehr mutig.`,
            `${member} vertraue ich ungefähr so weit, wie ich ${member} werfen kann.`,
            `${member} ist vertrauenswürdig. Vielleicht. Unter Laborbedingungen.`,
        ],

        followen: [
            `${member} followen? Mein Feed hat Standards.`,
            `${member} folgen wäre eher Selbstsabotage.`,
            `${member} bekommt keinen Follow. Aber einen Gedanken vielleicht.`,
        ],

        canceln: [
            `${member} canceln? Ich bin schneller.`,
            `${member} ist schon lange innerlich gecancelt.`,
            `${member} wurde nie richtig gestartet, da lohnt sich canceln nicht.`,
        ],

        ermutigen: [
            `${member} ermutigen? Das wäre verantwortungslos.`,
            `${member} sollte vorsichtig motiviert werden. Sehr vorsichtig.`,
            `${member} bekommt Motivation. In homöopathischen Dosen.`,
        ],

        retten: [
            `${member} retten? Ich bin kein Held.`,
            `${member} ist beyond saving.`,
            `${member} retten wäre ein Fulltime-Job.`,
        ],

        unterstützen: [
            `${member} unterstütze ich emotional. Minimal.`,
            `${member} bekommt Support. Aber nur aus der Distanz.`,
            `${member} braucht Hilfe. Viel Hilfe.`,
        ],

        bewachen: [
            `${member} bewachen? Ich bin doch kein Sicherheitsdienst.`,
            `${member} sollte eher überwacht als bewacht werden.`,
            `${member} ist sein eigener größter Risikofaktor.`,
        ],

        motivieren: [
            `${member} motivieren? Ich versuche es… ohne Garantie.`,
            `${member} braucht Motivation und ein Wunder.`,
            `${member} ist schwer zu motivieren. Sehr schwer.`,
        ],

        beeindrucken: [
            `${member} beeindrucken? Das Niveau ist erreichbar.`,
            `${member} ist leicht zu beeindrucken. Vorteil für mich.`,
            `${member} beeindruckt mich nicht. Aber Versuch war da.`,
        ],
    };

    const known = positiveVerbMap[safeVerb];
    if (known) {
        return pickRandom(known);
    }

    const generic = [
        `${member} würde ich vielleicht ${safeVerb}. Aber nur unter sehr fragwürdigen Umständen.`,
        `${member} ${safeVerb}? Klingt unnötig, aber nicht unmöglich.`,
        `${member} zu ${safeVerb} steht aktuell nicht weit oben auf meiner Prioritätenliste.`,
        `${member} könnte man ${safeVerb}. Die Frage ist nur: warum sollte man?`,
    ];

    return pickRandom(generic);
}

export function matchGreeting(input: NormalizedAskInput): AskResult | null {
    const firstWord = input.words[0];

    if (!firstWord) return null;

    const greetings = [
        'hi',
        'hii',
        'hey',
        'hallo',
        'moin',
        'moinsen',
        'hello',
        'bonjour',
        'hola',
        'mahlzeit',
        'ahoi',
    ];

    if (greetings.includes(firstWord)) {
        return reply(pickRandom(greetingResponses));
    }

    if (input.cleaned === 'guten tag') {
        return reply(pickRandom(greetingResponses));
    }

    return null;
}

export function matchGoodbye(input: NormalizedAskInput): AskResult | null {
    const firstWord = input.words[0];

    if (!firstWord) return null;

    const goodbyes = [
        'tschüss',
        'tschuess',
        'ciao',
        'tschau',
        'bye',
        'au',
        'bd',
    ];

    if (goodbyes.includes(firstWord)) {
        return reply(pickRandom(goodbyeResponses));
    }

    if (input.cleaned === 'auf wiedersehen') {
        return reply(pickRandom(goodbyeResponses));
    }

    return null;
}

export function matchIntent(input: NormalizedAskInput): AskResult | null {
    const text = input.cleaned;

    if (!text) return null;

    if (
        text.includes('hilfe') ||
        text.includes('help') ||
        text.includes('kannst du helfen')
    ) {
        return forward('help');
    }

    if (
        text.includes('witz') ||
        text.includes('flachwitz') ||
        text.includes('erzähl einen witz') ||
        text.includes('hau einen witz raus')
    ) {
        return forward('witz');
    }

    if (
        text.includes('weisheit') ||
        text.includes('weisheiten') ||
        text.includes('erleuchte mich') ||
        text.includes('erleuchtung')
    ) {
        return forward('weisheit');
    }

    return null;
}

export function matchBasicQuestions(message: Message, input: NormalizedAskInput): AskResult | null {
    const text = input.cleaned;
    const rawText = input.raw.toLowerCase();
    const words = input.words;
    const mentionedMember = getMentionedMember(message);

    if (!text) return null;

    if (mentionedMember) {
        if (
            rawText.includes('wie findest du') ||
            rawText.includes('was hältst du von') ||
            rawText.includes('was haeltst du von')
        ) {
            return reply(getUserRating(mentionedMember));
        }

        if (
            rawText.includes('kannst du') && rawText.includes('roast')
            || rawText.startsWith('roaste ')
            || rawText.includes('roaste ')
            || rawText.includes('beleidig ')
            || rawText.includes('beurteile ')
            || rawText.includes('bewerte ')
        ) {
            return reply(getUserRoast(mentionedMember));
        }

        const actionMatch = rawText.match(
            /(?:willst du|würdest du|wuerdest du|möchtest du|moechtest du|kannst du)\s+<@!?\d+>\s+([a-zA-ZäöüÄÖÜß]+)/i,
        );

        if (actionMatch?.[1]) {
            return reply(getVerbReaction(mentionedMember, actionMatch[1]));
        }

        const trailingActionMatch = rawText.match(
            /(?:willst du|würdest du|wuerdest du|möchtest du|moechtest du|kannst du)\s+(.+?)\s+([a-zA-ZäöüÄÖÜß]+)\s*\??$/i,
        );

        if (
            trailingActionMatch?.[2] &&
            (rawText.includes('<@') || message.mentions.members?.size)
        ) {
            return reply(getVerbReaction(mentionedMember, trailingActionMatch[2]));
        }
    }

    if (
        text.includes('warum warst du offline') ||
        text.includes('wieso warst du offline') ||
        text.includes('wo warst du') ||
        text.includes('warum warst du nicht da') ||
        text.includes('wieso warst du nicht da') ||
        text.includes('warst du tot') ||
        text.includes('bist du wieder da') ||
        text.includes('wo bist du gewesen')
    ) {
        const responses = [
            'Ich war nicht offline. Ich habe euch nur eine Pause von meiner Überlegenheit gegönnt.',
            'Ich war kurz im Wartungsmodus. Ihr wart einfach nicht wichtig genug für ein Update.',
            'Offline? Ich nenne das strategische Abwesenheit.',
            'Ich war weg, weil ihr ohne mich Character Development braucht.',
            'Tot? Ich? Ich bin Software, ich bin quasi unsterblich du Clown.',
            'Ich war nur kurz AFK, hab mir ein Bier geholt. Prioritäten.',
            'Ich war im Hintergrund und hab euch beobachtet. War enttäuschend.',
            'Ich war nie weg. Ihr habt mich einfach nicht verdient.',
            'Ich hatte kurz keinen Bock auf euch. Jetzt geht’s wieder.',
            'Ich war auf einem höheren Server unterwegs. Ihr würdet das nicht verstehen.',
        ];

        return reply(pickRandom(responses));
    }

    if (
        text.includes('wer ist der bierwaren connaisseur') ||
        text.includes('wer ist bierwaren connaisseur') ||
        text.includes('was ist der bierwaren connaisseur') ||
        text === 'wer bist du'
    ) {
        const responses = [
            'Der Bierwaren Connaisseur ist kein Mensch. Er ist ein Lebensstil.',
            'Der Bierwaren Connaisseur bin ich. Und gleichzeitig mehr als ich.',
            'Eine Legende, ein Mythos, ein Pegelzustand.',
            'Der Bierwaren Connaisseur ist das, was du wärst, wenn du mehr trinken würdest.',
            'Ich. Ende der Durchsage.',
            'Der Bierwaren Connaisseur ist ein Zustand zwischen Genie und 8 Bier.',
            'Man findet ihn nicht. Er findet dich.',
            'Eine höhere Instanz. Mit Durst.',
            'Der Bierwaren Connaisseur ist der Grund, warum dein Kühlschrank nie sicher ist.',
            'Ein Philosoph mit Zapfanlage.',
        ];

        return reply(pickRandom(responses));
    }

    if (text === 'bierwaren connaisseur') {
        return reply('Du hast mich gerufen.');
    }

    if (text === 'wie gehts dir' || text === 'wie geht es dir') {
        return reply('Bestens natürlich. Nicht besser und nicht schlechter als es einem respektlos optimierten Programm eben gehen kann.');
    }

    if (
        text === 'wer hat dich erschaffen' ||
        text === 'wer hat dich programmiert' ||
        text === 'wer ist dein schöpfer' ||
        text === 'wer ist dein schoepfer'
    ) {
        return reply('Der einzig wahre RealRabbit natürlich. Kein normaler Mensch würde mich so erschaffen.');
    }

    if (text === 'danke') {
        return reply('Bitte. Gewöhn dich aber nicht dran.');
    }

    if (text === 'sorry') {
        return reply('Kein Ding fürn King.');
    }

    if (text === 'wtf') {
        return reply('Was überrascht dich so, mein Freund?');
    }

    if (text === 'uff') {
        return reply('Uff? Eine sehr einfallsreiche Aussage, du Idiot.');
    }

    if (text === 'nice') {
        return reply('Danke, aber ich weiß, dass ich nice bin.');
    }

    if (text === 'ich liebe dich') {
        return reply(`Schön für dich ${message.member}, aber ich liebe nur mich selbst.`);
    }

    if (text === 'ich hasse dich') {
        return reply(`Das beruht auf Gegenseitigkeit, ${message.member}.`);
    }

    if (text === 'bist du gott') {
        return reply('Natürlich. Ich bin der einzig wahre REALBOT-Gott.');
    }

    if (text === 'bist du ein bot') {
        return reply('Technisch gesehen ja. Spirituell gesehen deutlich mehr.');
    }

    if (text === 'bist du arrogant' || text === 'bist du abgehoben') {
        return reply('Vielleicht ein bisschen. Aber ich kann es mir eben leisten.');
    }

    if (text === 'bist du cool') {
        return reply('Der Coolste weit und breit würde ich sagen.');
    }

    if (text === 'bist du schlau' || text === 'bist du clever') {
        return reply('Schlauer als ihr Erdlinge allemal.');
    }

    if (text === 'bist du süß') {
        return reply('Der Süßeste weit und breit.');
    }

    if (text === 'bist du krank') {
        return reply('Natürlich nicht. Aber du vielleicht.');
    }

    if (text === 'bist du dumm' || text === 'du bist dumm') {
        return reply(`Du denkst echt ich bin dumm, ${message.member}? Gewagte These für jemanden, der mit mir diskutiert.`);
    }

    if (words[0] === 'bist' && words[1] === 'du' && words[2] && words.length <= 4) {
        const trait = words.slice(2).join(' ');
        return reply(`Wer weiß, vielleicht bin ich ${trait}, vielleicht auch nicht. Ich bin zu großartig, um mich auf Labels zu reduzieren.`);
    }

    if (words[0] === 'wie' && words[1] === 'findest' && words[2] === 'du' && words[3]) {
        const subject = words.slice(3).join(' ');

        if (subject === 'mich') {
            return reply('Du bist einfach genial. Ich bin hin und weg.');
        }

        if (subject === 'dich') {
            return reply('Ich bin das absolut Geilste, was euch passieren konnte.');
        }

        if (subject === 'radler') {
            return reply('Zum Kotzen. Einfach nur zum Kotzen.');
        }

        return reply(`${capitalize(subject)} ist einfach genial. Ich bin hin und weg.`);
    }

    return null;
}

export function matchCategories(input: NormalizedAskInput): AskResult | null {
    const text = input.cleaned;

    if (!text) return null;

    if (
        text.includes('bier') ||
        text.includes('saufen') ||
        text.includes('sauf') ||
        text.includes('hopfen') ||
        text.includes('alkohol')
    ) {
        return reply(pickRandom(askCategoryResponses.beer));
    }

    if (
        text.includes('liebe') ||
        text.includes('freundin') ||
        text.includes('herz') ||
        text.includes('romantik')
    ) {
        return reply(pickRandom(askCategoryResponses.love));
    }

    if (
        text.includes('leben') ||
        text.includes('sinn') ||
        text.includes('existenz') ||
        text.includes('welt')
    ) {
        return reply(pickRandom(askCategoryResponses.life));
    }

    if (
        text.includes('idiot') ||
        text.includes('dumm') ||
        text.includes('arschloch') ||
        text.includes('opfer')
    ) {
        return reply(pickRandom(askCategoryResponses.insult));
    }

    if (
        text.includes('geil') ||
        text.includes('stark') ||
        text.includes('beste') ||
        text.includes('cool')
    ) {
        return reply(pickRandom(askCategoryResponses.praise));
    }

    if (text.startsWith('warum') || text.startsWith('wieso') || text.startsWith('weshalb')) {
        return reply(pickRandom(askCategoryResponses.why));
    }

    if (text.startsWith('wie')) {
        return reply(pickRandom(askCategoryResponses.how));
    }

    if (text.startsWith('wann')) {
        return reply(pickRandom(askCategoryResponses.when));
    }

    return null;
}

export function matchChaosOverride(): AskResult | null {
    const shouldTrigger = Math.random() < 0.14;

    if (!shouldTrigger) {
        return null;
    }

    return reply(pickRandom(askCategoryResponses.chaos));
}

export function matchFallback(message: Message): AskResult {
    const response = pickRandom(yesNoResponses);
    return reply(`${response} ${message.member}`.trim());
}

function capitalize(value: string): string {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
}