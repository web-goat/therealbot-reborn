import { Events, type Client } from 'discord.js';

const welcomeMessages = [
    'Willkommen. Benimm dich oder ich übernehme das verbal.',
    'Schön, dass du da bist. Niemand hat gefragt, aber jetzt bist du halt hier.',
    'Ein neuer User. Noch mehr Verantwortung für mich. Großartig.',
    'Willkommen auf dem Server. Versuch bitte, weniger peinlich zu sein als der Durchschnitt hier.',
    'Du bist jetzt hier. Damit sinkt der Server-IQ automatisch ein wenig.',
];

function randomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

export function registerGuildMemberAddEvent(client: Client): void {
    client.on(Events.GuildMemberAdd, async (member) => {
        const targetChannel =
            member.guild.systemChannel ??
            member.guild.channels.cache.find(
                (channel) => channel.isTextBased() && 'send' in channel,
            );

        if (!targetChannel || !targetChannel.isTextBased()) {
            return;
        }

        await targetChannel.send(
            `${member}, ${randomItem(welcomeMessages)}`,
        );
    });
}