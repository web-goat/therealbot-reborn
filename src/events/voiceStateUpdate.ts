import {type Client, Events} from 'discord.js';
import {getVoiceRoastPlan, runVoiceRoastForPlan,} from '../services/voiceRoastService.js';

export function registerVoiceStateUpdateEvent(client: Client): void {
    client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
        if (!client.user) {
            return;
        }

        const targetChannel = newState.channel;

        if (!targetChannel) {
            return;
        }

        try {
            const plan = getVoiceRoastPlan({
                oldState,
                newState,
                botUserId: client.user.id,
            });

            if (!plan) {
                return;
            }

            await runVoiceRoastForPlan(plan);
        } catch (error) {
            console.error('Fehler beim Voice-Roast:', error);
        }
    });
}