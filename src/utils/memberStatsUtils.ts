import type { GuildMember } from 'discord.js';
import { ChannelType, PermissionsBitField } from 'discord.js';

export interface VisibleChannelStats {
    totalVisible: number;
    textVisible: number;
    voiceVisible: number;
}

export function getVisibleChannelStats(member: GuildMember): VisibleChannelStats {
    let totalVisible = 0;
    let textVisible = 0;
    let voiceVisible = 0;

    for (const channel of member.guild.channels.cache.values()) {
        const canView = channel
            .permissionsFor(member)
            ?.has(PermissionsBitField.Flags.ViewChannel);

        if (!canView) continue;

        totalVisible += 1;

        if (
            channel.type === ChannelType.GuildText ||
            channel.type === ChannelType.GuildAnnouncement ||
            channel.type === ChannelType.PublicThread ||
            channel.type === ChannelType.PrivateThread
        ) {
            textVisible += 1;
        }

        if (
            channel.type === ChannelType.GuildVoice ||
            channel.type === ChannelType.GuildStageVoice
        ) {
            voiceVisible += 1;
        }
    }

    return {
        totalVisible,
        textVisible,
        voiceVisible,
    };
}