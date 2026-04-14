import {
    EmbedBuilder,
    type GuildMember,
    type Message,
} from 'discord.js';
import type { Command } from '../types/command.js';
import {
    getRankResult,
    formatJoinDate,
    rankDefinitions,
} from '../utils/rankUtils.js';
import { getRandomRoast } from '../utils/roastUtils.js';

function getTargetMember(message: Message): GuildMember | null {
    return message.mentions.members?.first() ?? message.member;
}

function isCreator(userId: string): boolean {
    // 👉 HIER DEINE USER ID EINTRAGEN
    return userId === process.env.CREATOR_ID;
}

export const statsCommand: Command = {
    name: 'stats',
    aliases: ['statistik', 'userstats'],
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
                        : 'Maximalstufe erreicht. Du hast kein Leben.',
                    inline: false,
                },
            )
            .setFooter({
                text: getRandomRoast(creator),
            })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    },
};