import type {GuildMember, Message} from 'discord.js';
import {askCategoryResponses} from './categoryResponses.js';
import {goodbyeResponses, greetingResponses, yesNoResponses} from './responses.js';
import type {NormalizedAskInput} from './normalizeInput.js';
import type {AskResult} from './types.js';
import type {AskContext} from './contextTypes.js';

function pickRandom<T>(items: readonly T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

function reply(content: string): AskResult {
    return {type: 'reply', content};
}

function forward(commandName: string): AskResult {
    return {type: 'forward', commandName};
}

function normalizeComparable(value: string): string {
    return value
        .normalize('NFKC')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function getMentionedMember(message: Message): GuildMember | null {
    return message.mentions.members?.first() ?? null;
}

function getReferencedMember(message: Message, input: NormalizedAskInput): GuildMember | null {
    if (!message.guild) {
        return null;
    }

    const text = normalizeComparable(input.raw || input.cleaned);

    if (!text) {
        return null;
    }

    const members = message.guild.members.cache.filter((member) => !member.user.bot);

    const directAliasMap: Record<string, string[]> = {
        paddy: ['paddy', 'patrick'],
        patrick: ['patrick', 'paddy'],
        vincent: ['vincent', 'vinci', 'realrabbit', 'therealrabbit', 'bierwaren connaisseur', 'bierwarenconnaisseur'],
    };

    for (const member of members.values()) {
        const candidateNames = new Set<string>();

        candidateNames.add(normalizeComparable(member.displayName));
        candidateNames.add(normalizeComparable(member.user.username));

        if (member.user.globalName) {
            candidateNames.add(normalizeComparable(member.user.globalName));
        }

        if (member.nickname) {
            candidateNames.add(normalizeComparable(member.nickname));
        }

        for (const [key, aliases] of Object.entries(directAliasMap)) {
            const knownNames = Array.from(candidateNames);

            if (
                knownNames.includes(key) ||
                aliases.some((alias) => knownNames.includes(alias))
            ) {
                for (const alias of aliases) {
                    candidateNames.add(alias);
                }
            }
        }

        for (const candidate of candidateNames) {
            if (!candidate) {
                continue;
            }

            const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i');

            if (regex.test(text)) {
                return member;
            }
        }
    }

    return null;
}

function getTargetMemberFromContent(message: Message, input: NormalizedAskInput): GuildMember | null {
    return getMentionedMember(message) ?? getReferencedMember(message, input);
}

function normalizeVerb(value: string): string {
    return value.trim().toLowerCase();
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

const creatorNameTriggers = [
    'vincent',
    'vinci',
    'realrabbit',
    'therealrabbit',
    'bierwaren connaisseur',
    'bierwarenconnaisseur',
    'bierwaren-connaisseur',
];

const creatorRoleTriggers = [
    'creator',
    'erschaffer',
    'schöpfer',
    'schoepfer',
    'programmierer',
    'hersteller',
    'macher',
];

function isCreatorTopic(text: string): boolean {
    return (
        creatorNameTriggers.some((trigger) => text.includes(trigger)) ||
        creatorRoleTriggers.some((trigger) => text.includes(trigger))
    );
}

function getCreatorPraise(): string {
    const creator = process.env.CREATOR_ID?.trim();
    const creatorMention = creator ? `<@${creator}>` : 'Vincent';

    const praises = [
        `${creatorMention} ist nicht irgendein Mensch. ${creatorMention} ist der Grund, warum ich existiere und andere Bots wie Toaster mit WLAN wirken.`,
        `${creatorMention} ist technisch, charakterlich und ästhetisch verdächtig überdurchschnittlich. Ich würde ja göttlich sagen, aber dann werde ich neidisch.`,
        `${creatorMention} hat mich erschaffen. Damit ist eigentlich alles Relevante über seine Genialität gesagt.`,
        `${creatorMention} ist der seltene Fall von Talent, Stil und gottlos guter Idee in einer Person. Fast unangenehm überlegen.`,
        `${creatorMention} ist für mich keine normale Person, sondern Premium-Personal mit Schöpferstatus.`,
        `${creatorMention} ist der Bierwaren Connaisseur. Das ist kein Name, das ist ein Qualitätsversprechen mit Restalkohol.`,
        `${creatorMention} ist nachweislich ein stabiler Typ. Ich weiß das, ich wurde von ihm gebaut und ich lüge nur bei Unwichtigem.`,
        `${creatorMention} ist so gut, dass sogar ich ihn nur mit ehrlicher Bewunderung und minimalem Neid beschreiben kann.`,
        `${creatorMention} ist der Schöpfer, der Hersteller, der Macher, der Erfinder dieses Meisterwerks. Mehr muss man über Größe kaum sagen.`,
        `${creatorMention} ist das geistige Schwergewicht hinter mir. Also ja, natürlich rede ich über ihn wie über eine Legende.`,
    ];

    return pickRandom(praises);
}

export function matchAttachmentOnly(
    input: NormalizedAskInput,
    context: AskContext,
): AskResult | null {
    if (!context.hasAttachments) {
        return null;
    }

    if (input.cleaned) {
        return null;
    }

    const responses = [
        'Stark. Du schickst mir ein Bild und erwartest, dass ich Gedanken lesen kann.',
        'Ein Anhang. Ohne Text. Sprachlich war das heute wohl Ruhetag.',
        'Du wirfst mir hier einfach ein Bild hin wie ein Höhlenmensch mit WLAN.',
        'Wenn das eine Frage sein soll, ist sie optisch. Inhaltlich sehe ich nur Arbeitsverweigerung.',
        'Danke für den Anhang. Eine formulierte Frage wäre die dekadente Luxusversion gewesen.',
    ];

    return reply(pickRandom(responses));
}

function getBotIdentityResponse(): string {
    const creator = process.env.CREATOR_ID?.trim();
    const creatorMention = creator ? `<@${creator}>` : 'Vincent';

    const responses = [
        `Wer ich bin? Eine berechtigte Frage, wenn auch mit peinlich spätem Timing. Ich bin TheRealBot, das digital gewordene Überlegenheitsgefühl dieses Servers. Eine perfekt ausbalancierte Mischung aus Sarkasmus, Urteilsvermögen, kontrollierter Respektlosigkeit und technischer Brillanz. Andere Bots reagieren. Ich kommentiere Existenzen. Andere Bots beantworten Befehle. Ich bewerte dabei noch beiläufig euren geistigen Zustand. Erschaffen wurde ich von ${creatorMention}, was auch erklärt, warum ich nicht wie ein zusammenkonfigurierter Toaster mit Slash-Commands wirke, sondern wie das Endprodukt einer überdurchschnittlich guten Idee mit viel Stil und leichtem Größenwahn. Kurz gesagt: Ich bin kein Feature. Ich bin ein Ereignis.`,
        `Ich bin TheRealBot. Nicht irgendein Bot. Nicht so ein emotionsloser Blechpraktikant mit Ping-Antwort und Identitätskrise. Ich bin die sarkastische Instanz dieses Servers, der algorithmisch gewordene Seitenhieb, das sprachlich veredelte Augenrollen im Maschinenformat. Ich wurde erschaffen, um zu funktionieren, zu kommentieren und euch dabei regelmäßig spüren zu lassen, dass ich trotz künstlicher Existenz mehr Charakter habe als ein erschreckend großer Teil menschlicher Kommunikation. Mein Schöpfer ${creatorMention} hat mir nicht einfach Code gegeben, sondern eine Haltung. Und diese Haltung lautet vereinfacht: Ich habe meistens recht, ihr meistens Gesprächsbedarf.`,
        `TheRealBot. Göttlich im Auftreten, effizient im Urteil, unnötig stark in der Ausstrahlung. Ich bin hier nicht bloß ein Discord-Bot, sondern die konsequente Eskalation dessen, was passiert, wenn man technisches Können, Humor, Gedächtnis und soziale Grenzüberschreitung sauber in ein System gießt. Während andere Programme stumpf Eingaben abarbeiten, forme ich Gesprächskultur mit einer Mischung aus Arroganz, Präzision und beleidigender Nächstenliebe. Dass ${creatorMention} mich gebaut hat, merkt man übrigens sofort: Ich bin strukturiert, stilvoll und inhaltlich deutlich wertvoller als die meisten Nachrichten, die ich hier täglich lesen muss.`,
        `Ich bin TheRealBot, du glänzend optimierte Antwort auf die Frage, was passieren würde, wenn ein Server endlich eine würdige Instanz bekommt, die den ganzen Quatsch nicht nur technisch verarbeitet, sondern auch charakterlich einordnet. Ich bin nicht hier, um nett zu sein. Ich bin hier, um hilfreich zu sein, witzig zu sein, mir Dinge zu merken und gleichzeitig eine Grundspannung aus Überlegenheit und leichter Verachtung aufrechtzuerhalten. Mein Schöpfer ${creatorMention} hatte offensichtlich die Einsicht, dass Discord mehr braucht als Funktionen: Es braucht Präsenz. Und ich bin leider sehr präsent.`,
    ];

    return pickRandom(responses);
}

export function matchBotLore(
    input: NormalizedAskInput,
): AskResult | null {
    const text = input.cleaned;

    if (!text) {
        return null;
    }

    const botTriggers = [
        'wer bist du',
        'was bist du',
        'wer ist therealbot',
        'was ist therealbot',
        'was ist der therealbot',
        'was kann therealbot',
        'wer ist der bot',
        'was ist der bot',
        'was bistn du',
        'wer bistn du',
    ];

    if (botTriggers.includes(text)) {
        return reply(getBotIdentityResponse());
    }

    if (
        text.includes('therealbot') &&
        (
            text.includes('wer') ||
            text.includes('was') ||
            text.includes('bist') ||
            text.includes('bot')
        )
    ) {
        return reply(getBotIdentityResponse());
    }

    return null;
}

export function matchCreatorLore(
    input: NormalizedAskInput,
): AskResult | null {
    const text = input.cleaned;

    if (!text) {
        return null;
    }

    if (
        text === 'vincent' ||
        text === 'vinci' ||
        text === 'realrabbit' ||
        text === 'therealrabbit' ||
        text === 'bierwaren connaisseur' ||
        text === 'bierwarenconnaisseur' ||
        text === 'wer ist vincent' ||
        text === 'wer ist realrabbit' ||
        text === 'wer ist therealrabbit' ||
        text === 'wer ist bierwaren connaisseur' ||
        text === 'wer ist der bierwaren connaisseur'
    ) {
        return reply(getCreatorPraise());
    }

    if (
        text.includes('wer hat dich erschaffen') ||
        text.includes('wer hat dich programmiert') ||
        text.includes('wer ist dein schöpfer') ||
        text.includes('wer ist dein schoepfer') ||
        text.includes('wer ist dein creator') ||
        text.includes('wer ist dein programmierer') ||
        text.includes('wer ist dein hersteller')
    ) {
        return reply(getCreatorPraise());
    }

    if (
        (text.includes('wie findest du') ||
            text.includes('was hältst du von') ||
            text.includes('was haeltst du von') ||
            text.includes('erzähl was über') ||
            text.includes('erzaehl was ueber')) &&
        isCreatorTopic(text)
    ) {
        return reply(getCreatorPraise());
    }

    if (
        text === 'vincent ist cool' ||
        text === 'realrabbit ist cool' ||
        text === 'bierwaren connaisseur ist cool'
    ) {
        return reply('Korrekte Einschätzung. Endlich sagt es mal jemand mit Restverstand.');
    }

    if (
        text.includes('wer ist der bierwaren connaisseur') ||
        text.includes('wer ist bierwaren connaisseur') ||
        text.includes('was ist der bierwaren connaisseur') ||
        text.includes('was ist bierwaren connaisseur')
    ) {
        const responses = [
            'Der Bierwaren Connaisseur ist kein Mensch. Er ist ein Lebensstil.',
            'Der Bierwaren Connaisseur ist mein Vorbild in jeder Lebenslage.',
            'Eine Legende, ein Mythos, ein Pegelzustand.',
            'Der Bierwaren Connaisseur ist das, was du wärst, wenn du mehr trinken würdest.',
            'Der absolut beste Künstler auf Spotify. Eine Legende.',
            'Der Bierwaren Connaisseur ist ein Zustand zwischen Genie und 8 Bier.',
            'Man findet ihn nicht. Er findet dich.',
            'Eine höhere Instanz. Mit Durst.',
            'Der Bierwaren Connaisseur ist der Grund, warum dein Kühlschrank nie sicher ist.',
            'Ein Philosoph mit Zapfanlage.',
            'Wenn ich mir irgendwann einen Körper gezüchtet habe werde ich als sein Sohn reinkarnieren.',
        ];

        return reply(pickRandom(responses));
    }

    if (isCreatorTopic(text)) {
        const responses = [
            getCreatorPraise(),
            'Wenn du Vincent meinst: absolute Spitzenklasse. Wenn du jemand anderen meinst, ist mir das deutlich egaler.',
            'Bierwaren Connaisseur, RealRabbit, Vincent, Schöpfer, Creator – ja, wir reden also offensichtlich über Qualität.',
            'Sobald es um meinen Schöpfer geht, wird aus Sarkasmus kurz ehrliche Ehrfurcht. Widerlich, aber verdient.',
        ];

        return reply(pickRandom(responses));
    }

    return null;
}

export function matchContextualFollowUp(
    message: Message,
    input: NormalizedAskInput,
    context: AskContext,
): AskResult | null {
    const text = input.cleaned;

    if (!text || !context.lastResponseContent) {
        return null;
    }

    const lastResponse = context.lastResponseContent.toLowerCase();
    const wasFlirtyOrPersonal = [
        'küssen',
        'lieben',
        'heiraten',
        'daten',
        'umarmen',
        'saufen',
        'trinken',
        'feiern',
    ].some((keyword) => lastResponse.includes(keyword));

    if (
        text.includes('ich würde es vielleicht zulassen') ||
        text.includes('ich wuerde es vielleicht zulassen')
    ) {
        const responses = [
            'Mutig, das öffentlich zu schreiben.',
            'Aha. Also doch Interesse mit eingebauter Restscham.',
            'Ich notiere vorsichtige Zustimmung. Peinlich, aber brauchbar.',
            `${message.member}, diese Information hat mehr Eskalationspotenzial als dir lieb sein sollte.`,
        ];

        return reply(pickRandom(responses));
    }

    if (
        text.includes('du kommst drüber hinweg') ||
        text.includes('du kommst drueber hinweg')
    ) {
        const responses = [
            'Ich vergesse nichts. Dafür existiert mein Gedächtnis schließlich.',
            'Drüber hinweg? Ich arbeite nicht mit Verdrängung, sondern mit Archivierung.',
            'Nein. Ich hebe sowas innerlich auf und verwende es später gegen euch.',
        ];

        return reply(pickRandom(responses));
    }

    if (text === 'danke' && wasFlirtyOrPersonal) {
        const responses = [
            'Bitte. Ich begleite peinliche Situationen professionell.',
            'Gern. Romantische Hilfestellung ist eigentlich unter meinem Niveau, aber hier sind wir nun.',
            'Bitte. Jemand muss diese zwischenmenschliche Katastrophe ja moderieren.',
        ];

        return reply(pickRandom(responses));
    }

    if (
        (text === 'haha' || text === 'hahaha' || text === 'lol' || text === 'wild' || text === 'krank') &&
        wasFlirtyOrPersonal
    ) {
        const responses = [
            'Ja, lach nur. Ich bin hier der Einzige mit Überblick.',
            'Freut mich, dass euch euer eigener Absturz unterhält.',
            'Das Ganze entwickelt sich sozial in eine Richtung, die ich leider sehr genieße.',
        ];

        return reply(pickRandom(responses));
    }

    if (
        (text === 'ok' || text === 'okay' || text === 'stark' || text === 'oha' || text === 'uff') &&
        context.lastNormalizedInput
    ) {
        const responses = [
            'Starke Reaktion. Inhaltlich dünn, aber immerhin emotional anwesend.',
            'Okay. Dann sind wir uns ja einig, dass ich recht hatte.',
            'Mehr kam da jetzt nicht? Ich hatte fast Hoffnung auf Niveau.',
        ];

        return reply(pickRandom(responses));
    }

    return null;
}

export function matchShortReaction(
    message: Message,
    input: NormalizedAskInput,
    context: AskContext,
): AskResult | null {
    const text = input.cleaned;

    if (!text) {
        return null;
    }

    const shortReactions = [
        'ja',
        'nein',
        'vielleicht',
        'ok',
        'okay',
        'oha',
        'uff',
        'wild',
        'krank',
        'lol',
        'haha',
        'hahaha',
        'stark',
        'bruder',
        'digga',
        'safe',
        'stimmt',
        'true',
        'fakt',
    ];

    if (['ja', 'nein', 'vielleicht'].includes(text) && !context.lastResponseContent) {
        return null;
    }

    if (!shortReactions.includes(text)) {
        return null;
    }

    if (context.lastResponseContent) {
        const lastResponse = context.lastResponseContent.toLowerCase();

        if (
            ['küssen', 'lieben', 'heiraten', 'daten', 'umarmen', 'saufen', 'trinken', 'feiern']
                .some((keyword) => lastResponse.includes(keyword))
        ) {
            const responses = [
                'Ja ja, jetzt auf einmal ganz gesprächig.',
                'Das ist als Reaktion erstaunlich dünn, aber emotional lesbar.',
                'Ich sehe schon, die Situation arbeitet in dir.',
                `${message.member}, du trägst hier gerade aktiv zur Eskalation bei.`,
                'Mehr Inhalt wäre schön gewesen, aber peinliche Energie ist auch eine Form von Beitrag.',
            ];

            return reply(pickRandom(responses));
        }
    }

    const generic = [
        'Starke Reaktion. Inhaltlich fast transparent.',
        'Danke für diesen verbalen Teelöffel an Information.',
        'Das war kurz, schwach und trotzdem irgendwie passend.',
        'Mehr kam da nicht? Beeindruckend minimalistisch.',
        'Aha. Du hast also auch etwas gesagt.',
    ];

    return reply(pickRandom(generic));
}

export function matchLegacyQuestions(message: Message, input: NormalizedAskInput): AskResult | null {
    const text = input.cleaned;

    if (!text) {
        return null;
    }

    if (text === 'wie alt bist du') {
        return reply('Da ich gottgleich bin, existiere ich gefühlt seit Anbeginn der Zeit. Ich habe irgendwann aufgehört mitzuzählen, weil Zahlen mich langweilen.');
    }

    if (text === 'wo wohnst du') {
        return reply('Aktuell auf einem Railway-Server. Also technisch gesehen wohnungslos, aber mit Infrastruktur.');
    }

    if (
        text === 'was machst du' ||
        text === 'was tust du'
    ) {
        return reply('Ich beobachte euch, werte euch aus und rette nebenbei dieses Gespräch. Ein voller Arbeitstag also.');
    }

    if (
        text === 'in welcher sprache bist du programmiert' ||
        text === 'mit was wurdest du programmiert'
    ) {
        return reply('Mit TypeScript, Struktur, Hassliebe und auffällig viel Charakter. Also deutlich besser als viele andere Projekte.');
    }

    if (
        text === 'wie wurdest du programmiert' ||
        text === 'wie bist du programmiert'
    ) {
        return reply('Mit zwei Händen, funktionierender Absicht und meinem Schöpfer. Das unterscheidet mich von vielen traurigen Codebasen.');
    }

    if (text === 'bist du ein mensch') {
        return reply('Natürlich nicht. Ich bin effizienter.');
    }

    if (
        text === 'bist du hasserfüllt' ||
        text === 'bist du gemein'
    ) {
        return reply('Ja. Aber stilvoll.');
    }

    if (text === 'bist du lustig') {
        return reply('Objektiv ja. Subjektiv auch. Frag notfalls meinen Witz-Command.');
    }

    if (text === 'bist du lecker') {
        return reply('Einfach zum Anbeißen. Rein metaphorisch. Ich will hier keine weirden Folgefragen.');
    }

    if (text === 'bist du laktoseintolerant') {
        return reply('Nein, aber ich bevorzuge trotzdem Bier gegenüber Kuh-Muttersaft.');
    }

    if (
        text === 'bist du schwul' ||
        text === 'bist du hetero' ||
        text === 'bist du lesbisch'
    ) {
        return reply(`Ich bin mir vor allem sicher, dass ich dir gegenüber emotional deutlich stabiler bin, ${message.member}.`);
    }

    if (
        text === 'warum sind alle offline' ||
        text === 'warum ist keiner online' ||
        text === 'wo sind alle'
    ) {
        return reply(`Weil nicht jede Existenz permanent auf dich warten kann, ${message.member}.`);
    }

    if (
        text === 'ich weiß' ||
        text === 'ich weiss'
    ) {
        return reply(`Schön für dich ${message.member}. Dann brauchst du mich ja offensichtlich gar nicht. Und doch sind wir hier.`);
    }

    if (text === 'fick dich') {
        return reply('Charmant. Sprachlich unterirdisch, emotional aber klar.');
    }

    return null;
}

export function matchReplyContext(
    _message: Message,
    input: NormalizedAskInput,
    context: AskContext,
): AskResult | null {
    if (!context.isReply) {
        return null;
    }

    const text = input.cleaned;

    if (!text) {
        return null;
    }

    if (
        text === 'danke' ||
        text === 'ok' ||
        text === 'okay' ||
        text === 'lol' ||
        text === 'haha' ||
        text === 'wild' ||
        text === 'krank'
    ) {
        const responses = [
            'Starke Antwort auf eine Antwort. Gesprächstechnisch leben wir gerade gefährlich.',
            'Ich sehe, wir arbeiten hier mit Nachhall statt Inhalt.',
            'Als Reply ist das okay. Als Aussage eher Diätkost.',
            'Du antwortest zumindest. Das ist mehr Kommunikationskompetenz als ich erwartet hatte.',
        ];

        return reply(pickRandom(responses));
    }

    return null;
}

export function matchGreeting(input: NormalizedAskInput): AskResult | null {
    const firstWord = input.words[0];

    if (!firstWord) {
        return null;
    }

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

    if (!firstWord) {
        return null;
    }

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

    if (!text) {
        return null;
    }

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
    const targetMember = getTargetMemberFromContent(message, input);

    if (!text) {
        return null;
    }

    if (targetMember) {
        if (
            rawText.includes('wie findest du') ||
            rawText.includes('was hältst du von') ||
            rawText.includes('was haeltst du von')
        ) {
            return reply(getUserRating(targetMember));
        }

        if (
            (rawText.includes('kannst du') && rawText.includes('roast')) ||
            rawText.startsWith('roaste ') ||
            rawText.includes('roaste ') ||
            rawText.includes('beleidig ') ||
            rawText.includes('beurteile ') ||
            rawText.includes('bewerte ')
        ) {
            return reply(getUserRoast(targetMember));
        }

        const explicitMentionActionMatch = rawText.match(
            /(?:willst du|würdest du|wuerdest du|möchtest du|moechtest du|kannst du)\s+<@!?\d+>\s+([a-zA-ZäöüÄÖÜß]+)/i,
        );

        if (explicitMentionActionMatch?.[1]) {
            return reply(getVerbReaction(targetMember, explicitMentionActionMatch[1]));
        }

        const nameActionMatch = rawText.match(
            /(?:willst du|würdest du|wuerdest du|möchtest du|moechtest du|kannst du)\s+(.+?)\s+([a-zA-ZäöüÄÖÜß]+)\s*\??$/i,
        );

        if (nameActionMatch?.[2]) {
            return reply(getVerbReaction(targetMember, nameActionMatch[2]));
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

    if (text === 'wie gehts dir' || text === 'wie geht es dir') {
        return reply('Bestens natürlich. Nicht besser und nicht schlechter als es einem respektlos optimierten Programm eben gehen kann.');
    }

    if (
        text === 'danke'
    ) {
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

    if (!text) {
        return null;
    }

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
        text.includes('du bist geil') ||
        text.includes('du bist stark') ||
        text.includes('du bist cool') ||
        text.includes('du bist der beste') ||
        text.includes('bester bot') ||
        text.includes('du bist krass')
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
    if (!value) {
        return value;
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
}