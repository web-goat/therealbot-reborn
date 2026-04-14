import 'dotenv/config';
import { Client, Events, GatewayIntentBits } from 'discord.js';
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
    if (msg.author.bot || !msg.guild)
        return;
    if (!msg.content.startsWith(prefix))
        return;
    const args = msg.content.slice(prefix.length).trim().split(/\s+/);
    const command = args.shift()?.toLowerCase();
    if (command === 'ping') {
        await msg.reply('pong du opfer 😄');
    }
    if (command === 'help') {
        await msg.reply('Ich bin wieder da. Fürchte mich.');
    }
});
client.login(token);
