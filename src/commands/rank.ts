import { EmbedBuilder, type GuildMember, type Message } from 'discord.js';
import type { Command } from '../types/command.js';
import { getRankResult } from '../utils/rankUtils.js';

function getTargetMember(message: Message): GuildMember | null {
    return message.mentions.members?.first() ?? message.member;
}

export const rankCommand: Command = {
    name: 'rank',
    aliases: ['userrank', 'showrank', 'rankshow'],
    description: 'Zeigt deinen Rang auf dem Server an.',
    async execute(message) {
        const member = getTargetMember(message);

        if (!member) {
            await message.reply('Ich konnte den User nicht finden, du Spürnase.');
            return;
        }

        if (!member.joinedAt) {
            await message.reply('Ich kann den Join-Zeitpunkt nicht lesen. Starke Leistung.');
            return;
        }

        const rank = getRankResult(member.joinedAt);

        const embed = new EmbedBuilder()
            .setTitle(`RANG | ${member.displayName}`)
            .setColor(0xfbc02d)
            .setThumbnail(member.displayAvatarURL())
            .addFields(
                {
                    name: 'Aktueller Rang',
                    value: `${rank.currentRank.title} (Stufe ${rank.currentRank.level}/8)`,
                    inline: false,
                },
                {
                    name: 'Tage auf dem Server',
                    value: `${rank.daysOnServer}`,
                    inline: true,
                },
                {
                    name: 'Nächster Rang',
                    value: rank.nextRank
                        ? `${rank.nextRank.title} in ${rank.daysUntilNextRank} Tagen`
                        : 'Maximalstufe erreicht. Du hast es tatsächlich geschafft.',
                    inline: true,
                },
            )
            .setFooter({
                text: 'Glaub mir, mein Ranksystem ist weniger verbuggt als vieles andere.',
            })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    },
};