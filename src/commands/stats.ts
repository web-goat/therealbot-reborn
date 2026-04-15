import {EmbedBuilder, type GuildMember, type Message,} from 'discord.js';
import type {Command} from '../types/command.js';
import {formatJoinDate, getRankResult, rankDefinitions,} from '../utils/rankUtils.js';
import {getVisibleChannelStats} from '../utils/memberStatsUtils.js';
import {getStatsFooterComment} from '../utils/statsCommentUtils.js';
import {getStatsMemoryView} from '../services/statsService.js';

function getTargetMember(message: Message): GuildMember | null {
    return message.mentions.members?.first() ?? message.member;
}

function isCreator(userId: string): boolean {
    const creatorId = process.env.CREATOR_ID?.trim();

    if (!creatorId) {
        return false;
    }

    return userId === creatorId;
}

function formatOptionalDate(date: Date | null): string {
    if (!date) {
        return 'Noch nichts gespeichert.';
    }

    return new Intl.DateTimeFormat('de-DE', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

export const statsCommand: Command = {
    name: 'stats',
    aliases: ['statistik', 'userstats', 'status'],
    description: 'Zeigt detaillierte Stats eines Users an.',
    async execute(message) {
        const member = getTargetMember(message);

        if (!member) {
            await message.reply('User nicht gefunden. Stark.');
            return;
        }

        if (!member.joinedAt) {
            await message.reply('Join-Datum nicht verfügbar. Pech gehabt.');
            return;
        }

        const rank = getRankResult(member.joinedAt);
        const creator = isCreator(member.id);
        const visibleChannels = getVisibleChannelStats(member);
        const totalChannelsInGuild = member.guild.channels.cache.size;
        const percent = totalChannelsInGuild > 0
            ? Math.round((visibleChannels.totalVisible / totalChannelsInGuild) * 100)
            : 0;
        const memoryStats = await getStatsMemoryView(member.guild.id, member.id);

        const embed = new EmbedBuilder()
            .setTitle(`STATS | ${member.displayName}`)
            .setColor(0xfbc02d)
            .setThumbnail(member.displayAvatarURL())
            .addFields(
                {
                    name: 'Server beigetreten',
                    value: formatJoinDate(member.joinedAt),
                    inline: false,
                },
                {
                    name: 'Tage auf dem Server',
                    value: `${rank.daysOnServer}`,
                    inline: true,
                },
                {
                    name: 'Rang',
                    value: `${rank.currentRank.title} (Stufe ${rank.currentRank.level}/${rankDefinitions.length})`,
                    inline: true,
                },
                {
                    name: 'Fortschritt',
                    value: rank.nextRank
                        ? `Noch ${rank.daysUntilNextRank} Tage bis **${rank.nextRank.title}**`
                        : 'Maximalstufe erreicht. Du hast offiziell kein Leben.',
                    inline: false,
                },
                {
                    name: 'Sichtbare Channels',
                    value: `${visibleChannels.totalVisible} / ${totalChannelsInGuild} (${percent}%)`,
                    inline: true,
                },
                {
                    name: 'Davon Textkanäle',
                    value: `${visibleChannels.textVisible}`,
                    inline: true,
                },
                {
                    name: 'Davon Voicekanäle',
                    value: `${visibleChannels.voiceVisible}`,
                    inline: true,
                },
                {
                    name: 'Gedächtnis aktiv seit',
                    value: formatOptionalDate(memoryStats.memoryStartedAt),
                    inline: false,
                },
                {
                    name: 'So viele Nachrichten versendet seit mein Gedächtnis da ist',
                    value: `${memoryStats.messagesSentCount}`,
                    inline: true,
                },
                {
                    name: 'So viele Nachrichten gelöscht',
                    value: `${memoryStats.messagesDeletedCount}`,
                    inline: true,
                },
                {
                    name: 'So viele Nachrichten editiert',
                    value: `${memoryStats.messagesEditedCount}`,
                    inline: true,
                },
                {
                    name: 'So oft mit mir interagiert',
                    value: `${memoryStats.botInteractionCount}`,
                    inline: true,
                },
                // {
                //     name: 'Letzte gespeicherte Nachricht',
                //     value: formatOptionalDate(memoryStats.lastMessageAt),
                //     inline: true,
                // },
                // {
                //     name: 'Letzte Bot-Interaktion',
                //     value: formatOptionalDate(memoryStats.lastBotInteractionAt),
                //     inline: true,
                // },
            )
            .setFooter({
                text: getStatsFooterComment({
                    isCreator: creator,
                    visibleChannels: visibleChannels.totalVisible,
                    totalChannelsInGuild,
                }),
            })
            .setTimestamp();

        await message.reply({embeds: [embed]});
    },
};