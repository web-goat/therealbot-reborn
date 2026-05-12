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
    | 'groupProject';

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

    const duoIntros: VoiceInteractionIntro[] = [
        {
            type: 'blame',
            text: `${names}. Wer von euch ist verantwortlich dafür, dass ich jetzt hier reinkommen musste?`,
        },
        {
            type: 'mainCharacter',
            text: `${names}. Wer von euch glaubt ernsthaft, hier der Main Character zu sein?`,
        },
        {
            type: 'warningLabel',
            text: `${names}. Wer von euch hätte in diesem Voice am ehesten einen Warnhinweis verdient?`,
        },
        {
            type: 'oneWord',
            text: `${names}. Beschreibt diesen Channel mal mit genau einem Wort.`,
        },
        {
            type: 'rescue',
            text: `${names}. Soll ich euch retten oder einfach dokumentieren, wie es schlimmer wird?`,
        },
        {
            type: 'confidence',
            text: `${names}. Wer von euch hat heute das gefährlichste Selbstbewusstsein mitgebracht?`,
        },
        {
            type: 'groupProject',
            text: `${names}. Wer von euch wäre im Gruppenprojekt der Grund, warum alle heimlich alleine weiterarbeiten?`,
        },
    ];

    const newcomerIntros: VoiceInteractionIntro[] = [
        {
            type: 'blame',
            text: `${target}, bist du freiwillig hier reingekommen oder hat dich jemand geschickt?`,
        },
        {
            type: 'mainCharacter',
            text: `${target}, kurze Frage: Kommst du als Main Character rein oder eher als Nebenquest?`,
        },
        {
            type: 'warningLabel',
            text: `${target}, welchen Warnhinweis müsste Discord anzeigen, bevor du einem Voice joinst?`,
        },
        {
            type: 'oneWord',
            text: `${target}, beschreib deinen Einstieg hier mal mit einem Wort.`,
        },
        {
            type: 'rescue',
            text: `${target}, brauchst du Hilfe oder soll ich einfach zusehen, wie du dich einordnest?`,
        },
        {
            type: 'confidence',
            text: `${target}, wie viel Selbstbewusstsein bringst du mit und ist davon irgendwas berechtigt?`,
        },
        {
            type: 'groupProject',
            text: `${target}, wärst du im Gruppenprojekt eher Hilfe oder nur im Dokument eingetragen?`,
        },
    ];

    return randomItem(plan.mode === 'duo' ? duoIntros : newcomerIntros);
}

function buildFallbackRoastText(plan: VoiceRoastPlan): string {
    if (plan.mode === 'duo') {
        const names = plan.targets.map((member) => member.displayName).join(' und ');

        return `${names}, ihr wirkt wie ein Gruppenchat, der aus Versehen Ton bekommen hat.`;
    }

    const name = plan.targets[0]?.displayName ?? 'Unbekannt';

    return `${name} kommt rein und klingt direkt wie ein Update, das keiner installieren wollte.`;
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
            `${names}, keine Antwort. Selbst eure Spontanität ist im Ladebildschirm.`,
            `${names}, stark geschwiegen. Das war fast schon ein Eingeständnis.`,
            `Okay, niemand sagt was. Ich werte das als kollektives Schuldbekenntnis.`,
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