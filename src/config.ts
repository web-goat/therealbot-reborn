import 'dotenv/config';

export const config = {
    token: process.env.DISCORD_TOKEN,
    prefix: process.env.PREFIX ?? ':',
};

if (!config.token) {
    throw new Error('DISCORD_TOKEN fehlt');
}