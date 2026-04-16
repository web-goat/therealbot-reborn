import {
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    entersState,
    NoSubscriberBehavior,
    type VoiceConnection,
} from '@discordjs/voice';
import {unlink} from 'node:fs/promises';
import {generateSpeechFile} from './voiceTtsService.js';

export async function playSpeechTextInVoiceChannel(
    connection: VoiceConnection,
    text: string,
): Promise<void> {
    const audioFilePath = await generateSpeechFile(text);

    const player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Stop,
        },
    });

    try {
        const resource = createAudioResource(audioFilePath, {
            inlineVolume: true,
        });

        if (resource.volume) {
            resource.volume.setVolume(0.95);
        }

        connection.subscribe(player);
        player.play(resource);

        await entersState(player, AudioPlayerStatus.Playing, 10_000);
        await entersState(player, AudioPlayerStatus.Idle, 60_000);
    } finally {
        player.stop();

        try {
            await unlink(audioFilePath);
        } catch (error) {
            console.error('Temporäre TTS-Datei konnte nicht gelöscht werden:', error);
        }
    }
}