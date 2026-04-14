import { EmbedBuilder } from 'discord.js';
import type { Command } from '../types/command.js';
import { rankDefinitions } from '../utils/rankUtils.js';

function getMinDays(index: number): number {
    if (index === 0) return 0;

    const previous = rankDefinitions[index - 1];
    return Number.isFinite(previous.maxDaysInclusive)
        ? previous.maxDaysInclusive + 1
        : 0;
}

function formatRange(index: number): string {
    const rank = rankDefinitions[index];
    const minDays = getMinDays(index);

    if (!Number.isFinite(rank.maxDaysInclusive)) {
        return `ab ${minDays} Tagen`;
    }

    if (minDays === 0) {
        return `0 bis ${rank.maxDaysInclusive} Tage`;
    }

    return `${minDays} bis ${rank.maxDaysInclusive} Tage`;
}

export const showranksCommand: Command = {
    name: 'showranks',
    aliases: ['ranks', 'rangliste'],
    description: 'Zeigt alle Rangstufen auf dem Server an.',
    async execute(message) {
        const embed = new EmbedBuilder()
            .setTitle('RANGSYSTEM | Die offizielle Hasen-Hierarchie')
            .setDescription('Hier siehst du alle Ränge und ab wann du sie bekommst.')
            .setColor(0xfbc02d)
            .addFields(
                rankDefinitions.map((rank, index) => ({
                    name: `Stufe ${rank.level} | ${rank.title}`,
                    value: formatRange(index),
                    inline: false,
                })),
            )
            .setFooter({
                text: 'Streng, ungerecht und trotzdem besser als die meisten echten Systeme.',
            })
            .setTimestamp();

        await message.reply({
            content: 'Glaub mir, mein Ranksystem ist weniger verbuggt als vieles andere:',
            embeds: [embed],
        });
    },
};