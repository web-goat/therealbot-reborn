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
                {
                    name: `${config.prefix}ask | ${config.prefix}talk`,
                    value: 'Beantwortet Fragen und kommentiert dein Dasein.',
                    inline: false,
                },
                {
                    name: `${config.prefix}witz`,
                    value: 'Erzählt einen Witz.',
                    inline: false,
                },
                {
                    name: `${config.prefix}weisheit`,
                    value: 'Liefert fragwürdige Erleuchtung.',
                    inline: false,
                },
                {
                    name: `${config.prefix}autotalk`,
                    value: 'Steuert ungefragte Bot-Kommentare pro Channel.',
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