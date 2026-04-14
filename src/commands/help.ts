import { EmbedBuilder } from 'discord.js';
import type { Command } from '../types/command.js';
import { config } from '../config.js';

export const helpCommand: Command = {
    name: 'help',
    aliases: ['hilfe'],
    description: 'Zeigt alle verfügbaren Befehle an.',
    async execute(message) {
        const embed = new EmbedBuilder()
            .setTitle('HILFE | Befehlsliste')
            .setDescription('Hier sind die aktuell verfügbaren Befehle.')
            .setColor(0xfbc02d)
            .addFields(
                {
                    name: `${config.prefix}help | ${config.prefix}hilfe`,
                    value: 'Zeigt diese Hilfe an.',
                    inline: false,
                },
                {
                    name: `${config.prefix}ping`,
                    value: 'Testet, ob ich noch lebe.',
                    inline: false,
                },
            )
            .setFooter({
                text: 'TheRealBot – respektlos optimiert',
            })
            .setTimestamp();

        await message.reply({
            content: 'Ich helfe nur widerwillig, aber bitte:',
            embeds: [embed],
        });
    },
};