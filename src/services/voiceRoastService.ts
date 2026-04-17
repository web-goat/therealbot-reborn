import {entersState, getVoiceConnection, joinVoiceChannel, VoiceConnectionStatus,} from '@discordjs/voice';
import type {GuildMember, VoiceBasedChannel, VoiceState} from 'discord.js';
import {playSpeechTextInVoiceChannel} from './voiceSpeechService.js';
import {generateAiRoast} from './voiceRoastAiService.js';

const CHANNEL_COOLDOWN_MS = 5 * 60_000;
const ACTIVE_CHANNELS = new Set<string>();

interface VoiceRoastMemory {
    lastTriggeredAt: number;
    lastMemberIds: string[];
}

export interface VoiceRoastPlan {
    channel: VoiceBasedChannel;
    mode: 'duo' | 'newcomer';
    targets: GuildMember[];
    allHumans: GuildMember[];
    roastText: string;
}

const voiceRoastMemoryByChannel = new Map<string, VoiceRoastMemory>();

function getHumanMembers(channel: VoiceBasedChannel): GuildMember[] {
    return channel.members
        .filter((member) => !member.user.bot)
        .map((member) => member);
}

function sortIds(ids: string[]): string[] {
    return [...ids].sort();
}

function sameMemberSet(a: string[], b: string[]): boolean {
    if (a.length !== b.length) {
        return false;
    }

    const left = sortIds(a);
    const right = sortIds(b);

    return left.every((value, index) => value === right[index]);
}

function hasCooldownExpired(channelId: string): boolean {
    const memory = voiceRoastMemoryByChannel.get(channelId);

    if (!memory) {
        return true;
    }

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

    if (!joinedMember) {
        return null;
    }

    if (joinedMember.user.bot) {
        return null;
    }

    if (joinedMember.id === botUserId) {
        return null;
    }

    const oldChannelId = oldState.channelId;
    const newChannelId = newState.channelId;

    if (!newChannelId) {
        return null;
    }

    if (oldChannelId === newChannelId) {
        return null;
    }

    return joinedMember;
}

function buildFallbackRoastText(plan: VoiceRoastPlan): string {
    if (plan.mode === 'duo') {
        const [memberA, memberB] = plan.targets;
        const a = memberA?.displayName ?? 'Unbekannt';
        const b = memberB?.displayName ?? 'Unbekannt';

        return `${a} und ${b} gleichzeitig im Voice. Beeindruckend, wie man Einsamkeit auch kooperativ gestalten kann.`;
    }

    const [target] = plan.targets;
    const joinedName = target?.displayName ?? 'Unbekannt';

    return `${joinedName} joint dazu und senkt den durchschnittlichen Gesprächswert sofort messbar. Stark reingekommen.`;
}

export function getVoiceRoastPlan(input: {
    oldState: VoiceState;
    newState: VoiceState;
    botUserId: string;
}): VoiceRoastPlan | null {
    const {oldState, newState, botUserId} = input;
    const channel = newState.channel;

    if (!channel) {
        return null;
    }

    if (ACTIVE_CHANNELS.has(channel.id)) {
        return null;
    }

    if (channel.members.has(botUserId)) {
        return null;
    }

    const humans = getHumanMembers(channel);

    if (humans.length < 2) {
        return null;
    }

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

    if (sameAsLastState && !cooldownExpired) {
        return null;
    }

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

    if (ACTIVE_CHANNELS.has(channel.id)) {
        return;
    }

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

        let roastText: string;

        try {
            roastText = await generateAiRoast(plan);
        } catch (error) {
            console.error('Fehler bei AI-Voice-Roast-Generierung, nutze Fallback:', error);
            roastText = buildFallbackRoastText(plan);
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