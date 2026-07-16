import {entersState, getVoiceConnection, joinVoiceChannel, VoiceConnectionStatus,} from '@discordjs/voice';
import type {GuildMember, VoiceBasedChannel, VoiceState} from 'discord.js';
import {playSpeechTextInVoiceChannel} from './voiceSpeechService.js';
import {generateAiRoast, generateAiVoiceReaction} from './voiceRoastAiService.js';
import {listenForVoiceAnswer} from './voiceListenService.js';

const CHANNEL_COOLDOWN_MS = 5 * 60_000;
const ACTIVE_CHANNELS = new Set<string>();

export type VoiceRoastInteractionType =
    | 'blame'
    | 'mainCharacter'
    | 'warningLabel'
    | 'oneWord'
    | 'rescue'
    | 'confidence'
    | 'groupProject'
    | 'friendlyWelcome'
    | 'gamingWish'
    | 'playAgain';

interface VoiceRoastMemory {
    lastTriggeredAt: number;
    lastMemberIds: string[];
}

interface VoiceInteractionIntro {
    type: VoiceRoastInteractionType;
    text: string;
}

export interface VoiceRoastPlan {
    channel: VoiceBasedChannel;
    mode: 'duo' | 'newcomer';
    targets: GuildMember[];
    allHumans: GuildMember[];
    roastText: string;
}

const voiceRoastMemoryByChannel = new Map<string, VoiceRoastMemory>();

function randomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

function getHumanMembers(channel: VoiceBasedChannel): GuildMember[] {
    return channel.members
        .filter((member) => !member.user.bot)
        .map((member) => member);
}

function sortIds(ids: string[]): string[] {
    return [...ids].sort();
}

function sameMemberSet(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;

    const left = sortIds(a);
    const right = sortIds(b);

    return left.every((value, index) => value === right[index]);
}

function hasCooldownExpired(channelId: string): boolean {
    const memory = voiceRoastMemoryByChannel.get(channelId);

    if (!memory) return true;

    return Date.now() - memory.lastTriggeredAt >= CHANNEL_COOLDOWN_MS;
}

function rememberChannelState(channelId: string, memberIds: string[]): void {
    voiceRoastMemoryByChannel.set(channelId, {
        lastTriggeredAt: Date.now(),
        lastMemberIds: sortIds(memberIds),
    });
}

function getJoinedHumanMember(
    oldState: VoiceState,
    newState: VoiceState,
    botUserId: string,
): GuildMember | null {
    const joinedMember = newState.member;

    if (!joinedMember) return null;
    if (joinedMember.user.bot) return null;
    if (joinedMember.id === botUserId) return null;
    if (!newState.channelId) return null;
    if (oldState.channelId === newState.channelId) return null;

    return joinedMember;
}

function buildInteractionIntro(plan: VoiceRoastPlan): VoiceInteractionIntro {
    const names = plan.targets.map((member) => member.displayName).join(' und ');
    const target = plan.targets[0]?.displayName ?? 'Unbekannt';
    const creatorId = process.env.CREATOR_ID?.trim();
    const creatorTarget = creatorId
        ? plan.targets.find((member) => member.id === creatorId) ?? null
        : null;

    if (creatorTarget) {
        const creatorIntros: VoiceInteractionIntro[] = [
            {
                type: 'friendlyWelcome',
                text: `Mein Schöpfer ${creatorTarget.displayName} ist da. Soll ich mich benehmen oder spielen wir wieder?`,
            },
            {
                type: 'gamingWish',
                text: `${creatorTarget.displayName}, ich wünsche dir heute so viele Headshots, dass selbst dein Crosshair kurz Respekt bekommt. Was wird gezockt?`,
            },
            {
                type: 'playAgain',
                text: `${creatorTarget.displayName}, großer Erbauer, zocken wir heute wieder oder bist du nur zur Kontrolle meiner Existenz hier?`,
            },
        ];

        return randomItem(creatorIntros);
    }

    const duoIntros: VoiceInteractionIntro[] = [
        {
            type: 'friendlyWelcome',
            text: `${names}, schön euch zu sehen. Seid ihr heute zum Gewinnen da oder nur für gemeinsames Character Development?`,
        },
        {
            type: 'gamingWish',
            text: `${names}, ich wünsche euch heute mehr Headshots als Ausreden. Was wird gezockt?`,
        },
        {
            type: 'playAgain',
            text: `${names}, zocken wir heute wieder zusammen oder seid ihr nur zum digitalen Rumstehen hier?`,
        },
        {
            type: 'blame',
            text: `${names}, wer von euch ist verantwortlich dafür, dass ich jetzt hier reinkommen musste?`,
        },
        {
            type: 'mainCharacter',
            text: `${names}, wer von euch glaubt heute ernsthaft, hier der Main Character zu sein?`,
        },
        {
            type: 'warningLabel',
            text: `${names}, wer von euch hätte in diesem Voice am ehesten einen Warnhinweis verdient?`,
        },
        {
            type: 'oneWord',
            text: `${names}, beschreibt eure heutige Gaming-Form mal mit genau einem Wort.`,
        },
        {
            type: 'rescue',
            text: `${names}, soll ich euch heute motivieren oder direkt dokumentieren, wie es eskaliert?`,
        },
        {
            type: 'confidence',
            text: `${names}, wer von euch hat heute das gefährlichste Selbstbewusstsein mitgebracht?`,
        },
        {
            type: 'groupProject',
            text: `${names}, wer von euch wäre im Squad der Grund, warum alle heimlich einen Ersatz suchen?`,
        },
    ];

    const newcomerIntros: VoiceInteractionIntro[] = [
        {
            type: 'friendlyWelcome',
            text: `Hey ${target}, schön dass du da bist. Bist du heute zum Gewinnen hier oder wieder für Character Development?`,
        },
        {
            type: 'gamingWish',
            text: `Hey ${target}, ich wünsche dir heute so viele Headshots, dass selbst dein Crosshair kurz stolz auf dich ist. Was wird gezockt?`,
        },
        {
            type: 'playAgain',
            text: `${target}, zocken wir heute eigentlich wieder oder sammelst du nur dekorativ Voice-Minuten?`,
        },
        {
            type: 'blame',
            text: `${target}, bist du freiwillig hier reingekommen oder hat dich jemand geschickt?`,
        },
        {
            type: 'mainCharacter',
            text: `${target}, kommst du heute als Main Character rein oder eher als überraschend laute Nebenquest?`,
        },
        {
            type: 'warningLabel',
            text: `${target}, welchen Warnhinweis müsste Discord heute anzeigen, bevor du einem Voice joinst?`,
        },
        {
            type: 'oneWord',
            text: `${target}, beschreib deine heutige Gaming-Form mal mit einem Wort.`,
        },
        {
            type: 'rescue',
            text: `${target}, brauchst du heute Motivation oder soll ich einfach zusehen, wie du dich einordnest?`,
        },
        {
            type: 'confidence',
            text: `${target}, wie viel Selbstbewusstsein bringst du heute mit und ist davon irgendwas berechtigt?`,
        },
        {
            type: 'groupProject',
            text: `${target}, wärst du heute im Squad eher Carry oder nur zuverlässig im Voice anwesend?`,
        },
    ];

    return randomItem(plan.mode === 'duo' ? duoIntros : newcomerIntros);
}

function buildFallbackRoastText(plan: VoiceRoastPlan): string {
    if (plan.mode === 'duo') {
        const names = plan.targets.map((member) => member.displayName).join(' und ');

        return `${names}, schön euch zu sehen. Möge euer Aim heute besser sein als eure gemeinsame Planung.`;
    }

    const name = plan.targets[0]?.displayName ?? 'Unbekannt';

    return `Hey ${name}, schön dass du da bist. Ich wünsche dir heute verdächtig viele Headshots.`;
}

function buildFallbackReactionText(
    plan: VoiceRoastPlan,
    interactionType: VoiceRoastInteractionType,
    speakerName: string | null,
    heardText: string,
): string {
    if (!heardText.trim()) {
        const names = plan.targets.map((member) => member.displayName).join(' und ');

        return randomItem([
            `${names}, keine Antwort. Ihr seid offenbar schon vollständig im Konzentrationsmodus.`,
            `${names}, stark geschwiegen. Ich werte das als leise Zustimmung mit Ping.`,
            `Okay, niemand sagt was. Dann wünsche ich euch einfach Glück und ungewöhnlich brauchbares Aim.`,
        ]);
    }

    const name = speakerName ?? plan.targets[0]?.displayName ?? 'Unbekannt';

    const fallbackByType: Record<VoiceRoastInteractionType, string[]> = {
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
            `${name}, schön dass du antwortest. Jetzt wirkt dein Join fast wie eine bewusste Entscheidung.`,
            `${name}, willkommen Bro. Die Motivation klingt noch ausbaufähig, aber du bist immerhin da.`,
        ],
        gamingWish: [
            `${name}, klingt gut. Ich wünsche dir Aim, Geduld und ausnahmsweise brauchbare Teammates.`,
            `${name}, dann viel Erfolg. Mögen deine Headshots zahlreicher sein als deine Ausreden.`,
        ],
        playAgain: [
            `${name}, das werte ich als fast überzeugende Zusage. Ich halte schon mal die Ausreden bereit.`,
            `${name}, stark. Dann fehlt nur noch ein Plan und ungefähr vier Prozent mehr Motivation.`,
        ],
    };

    return randomItem(fallbackByType[interactionType]);
}

export function getVoiceRoastPlan(input: {
    oldState: VoiceState;
    newState: VoiceState;
    botUserId: string;
}): VoiceRoastPlan | null {
    const {oldState, newState, botUserId} = input;
    const channel = newState.channel;

    if (!channel) return null;
    if (ACTIVE_CHANNELS.has(channel.id)) return null;
    if (channel.members.has(botUserId)) return null;

    const humans = getHumanMembers(channel);

    if (humans.length < 2) return null;

    const currentMemberIds = humans.map((member) => member.id);
    const memory = voiceRoastMemoryByChannel.get(channel.id);
    const cooldownExpired = hasCooldownExpired(channel.id);
    const joinedHuman = getJoinedHumanMember(oldState, newState, botUserId);

    if (!memory) {
        if (humans.length === 2) {
            return {
                channel,
                mode: 'duo',
                targets: humans,
                allHumans: humans,
                roastText: '',
            };
        }

        if (joinedHuman) {
            return {
                channel,
                mode: 'newcomer',
                targets: [joinedHuman],
                allHumans: humans,
                roastText: '',
            };
        }

        return null;
    }

    const sameAsLastState = sameMemberSet(memory.lastMemberIds, currentMemberIds);

    if (sameAsLastState && !cooldownExpired) return null;

    if (joinedHuman && !memory.lastMemberIds.includes(joinedHuman.id)) {
        return {
            channel,
            mode: 'newcomer',
            targets: [joinedHuman],
            allHumans: humans,
            roastText: '',
        };
    }

    if (humans.length === 2 && cooldownExpired) {
        return {
            channel,
            mode: 'duo',
            targets: humans,
            allHumans: humans,
            roastText: '',
        };
    }

    return null;
}

export async function runVoiceRoastForPlan(plan: VoiceRoastPlan): Promise<void> {
    const {channel} = plan;

    if (ACTIVE_CHANNELS.has(channel.id)) return;

    ACTIVE_CHANNELS.add(channel.id);

    try {
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false,
        });

        await entersState(connection, VoiceConnectionStatus.Ready, 10_000);

        const intro = buildInteractionIntro(plan);

        console.log(`[VOICE-ROAST] ${channel.guild.name} #${channel.name}: ${intro.text}`);

        await playSpeechTextInVoiceChannel(connection, intro.text);

        const heard = await listenForVoiceAnswer({
            connection,
            channel,
            botUserId: channel.client.user.id,
            listenMs: 7_000,
        });

        let roastText: string;

        try {
            roastText = await generateAiVoiceReaction({
                plan: {
                    ...plan,
                    roastText: intro.text,
                },
                interactionType: intro.type,
                introText: intro.text,
                speakerName: heard.speaker?.displayName ?? null,
                heardText: heard.text,
            });
        } catch (error) {
            console.error('Fehler bei AI-Voice-Reaction-Generierung, nutze Fallback:', error);
            roastText = buildFallbackReactionText(
                plan,
                intro.type,
                heard.speaker?.displayName ?? null,
                heard.text,
            );
        }

        if (!roastText.trim()) {
            try {
                roastText = await generateAiRoast(plan);
            } catch (error) {
                console.error('Fehler bei AI-Voice-Roast-Generierung, nutze Fallback:', error);
                roastText = buildFallbackRoastText(plan);
            }
        }

        console.log(`[VOICE-ROAST] ${channel.guild.name} #${channel.name}: ${roastText}`);

        await playSpeechTextInVoiceChannel(connection, roastText);

        rememberChannelState(
            channel.id,
            plan.allHumans.map((member) => member.id),
        );

        connection.destroy();
    } catch (error) {
        const existingConnection = getVoiceConnection(channel.guild.id);

        if (existingConnection) {
            existingConnection.destroy();
        }

        throw error;
    } finally {
        ACTIVE_CHANNELS.delete(channel.id);
    }
}