import type { Command } from '../types/command.js';
import {
    disableAutotalkForChannel,
    enableAutotalkForChannel,
    getAutotalkConfig,
    getEnabledAutotalkChannelCount,
    isAutotalkEnabledForChannel,
    setAutotalkChance,
    setAutotalkCooldown,
} from '../utils/autotalkState.js';

export const autotalkCommand: Command = {
    name: 'autotalk',
    aliases: ['autocomment', 'nervmodus'],
    description: 'Steuert ungefragte Bot-Kommentare pro Channel.',
    async execute(message, args) {
        const subcommand = args[0]?.toLowerCase();
        const channelId = message.channel.id;
        const { randomChance, cooldownMs } = getAutotalkConfig();

        if (!subcommand) {
            const status = isAutotalkEnabledForChannel(channelId) ? 'AN' : 'AUS';

            await message.reply(
                `Autotalk ist hier aktuell **${status}**.\nChance: **${Math.round(
                    randomChance * 100,
                )}%**\nCooldown: **${cooldownMs / 1000}s**\nAktive Channels insgesamt: **${getEnabledAutotalkChannelCount()}**`,
            );
            return;
        }

        if (subcommand === 'on') {
            await enableAutotalkForChannel(channelId);
            await message.reply('Autotalk ist in diesem Channel jetzt AN. Möge der Terror beginnen.');
            return;
        }

        if (subcommand === 'off') {
            await disableAutotalkForChannel(channelId);
            await message.reply('Autotalk ist in diesem Channel jetzt AUS. Langweilig, aber okay.');
            return;
        }

        if (subcommand === 'chance') {
            const value = Number(args[1]);

            if (Number.isNaN(value) || value < 0 || value > 100) {
                await message.reply('Gib mir eine Zahl zwischen 0 und 100, du Mathematikverweigerer.');
                return;
            }

            await setAutotalkChance(value);
            await message.reply(`Autotalk-Chance auf **${value}%** gesetzt. Ihr wolltet es so.`);
            return;
        }

        if (subcommand === 'cooldown') {
            const value = Number(args[1]);

            if (Number.isNaN(value) || value < 0) {
                await message.reply('Gib mir sinnvolle Sekunden an, du Zeitverbrecher.');
                return;
            }

            await setAutotalkCooldown(value);
            await message.reply(`Autotalk-Cooldown auf **${value} Sekunden** gesetzt.`);
            return;
        }

        await message.reply('Unbekannter Autotalk-Befehl. Nutz `:autotalk on`, `off`, `chance 30` oder `cooldown 10`.');
    },
};