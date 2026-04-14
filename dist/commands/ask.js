import { getAskResponse } from '../utils/ask/getAskResponse.js';
export const askCommand = {
    name: 'ask',
    aliases: ['talk'],
    description: 'Antwortet auf Fragen und Gelaber.',
    async execute(message, args) {
        const response = getAskResponse(message, args);
        if (!response) {
            await message.reply('Nerv mich nicht!!');
            return;
        }
        await message.reply(response);
    },
};
