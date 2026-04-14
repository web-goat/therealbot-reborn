export const pingCommand = {
    name: 'ping',
    description: 'Antwortet mit pong.',
    async execute(message) {
        await message.reply('pong du opfer 😄');
    },
};
