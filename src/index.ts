import 'dotenv/config';
import { Client, GatewayIntentBits, Events } from 'discord.js';

const token = process.env.DISCORD_TOKEN;
const prefix = process.env.PREFIX ?? ':';

if (!token) {
    throw new Error('DISCORD_TOKEN fehlt');
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.once(Events.ClientReady, (c) => {
    console.log(`✅ ${c.user.tag} ist wieder auferstanden`);
});

client.on(Events.MessageCreate, async (msg) => {
    if (msg.author.bot || !msg.guild) return;
    if (!msg.content.startsWith(prefix)) return;

    const args = msg.content.slice(prefix.length).split(/\s+/);
    const command = args.shift()?.toLowerCase();

    if (command === 'ping') {
        await msg.reply('pong du opfer 😄');
    }

    if (command === 'join') {
        if (!msg.member?.voice.channel) {
            return msg.reply('geh erstmal in nen voice channel du clown');
        }

        await msg.member.voice.channel.join();
    }
});

client.login(token);