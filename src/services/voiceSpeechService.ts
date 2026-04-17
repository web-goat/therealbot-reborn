import {
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    entersState,
    NoSubscriberBehavior,
    type VoiceConnection,
} from '@discordjs/voice';
import {stat, unlink} from 'node:fs/promises';
import {generateSpeechFile} from './voiceTtsService.js';

export async function playSpeechTextInVoiceChannel(
    connection: VoiceConnection,
    text: string,
): Promise<void> {
    console.log('[VOICE] Start playback for text:', text);

    const audioFilePath = await generateSpeechFile(text);
    console.log('[VOICE] File generated:', audioFilePath);

    try {
        const fileStats = await stat(audioFilePath);
        console.log('[VOICE] File size:', fileStats.size);
    } catch (err) {
        console.error('[VOICE] File stat error:', err);
    }

    const player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Stop,
        },
    });

    player.on('stateChange', (oldState, newState) => {
        console.log('[VOICE] state:', oldState.status, '->', newState.status);
    });

    player.on('error', (error) => {
        console.error('[VOICE] Player error:', error);
    });

    try {
        const resource = createAudioResource(audioFilePath, {
            inlineVolume: true,
        });

        if (resource.volume) {
            resource.volume.setVolume(1);
        }

        const subscription = connection.subscribe(player);
        console.log('[VOICE] Subscription exists:', Boolean(subscription));

        player.play(resource);
        console.log('[VOICE] play() called');

        await entersState(player, AudioPlayerStatus.Playing, 10_000);
        console.log('[VOICE] Player is PLAYING');

        await entersState(player, AudioPlayerStatus.Idle, 60_000);
        console.log('[VOICE] Player finished (IDLE)');
    } catch (err) {
        console.error('[VOICE] Playback failed:', err);
    } finally {
        player.stop();

        try {
            await unlink(audioFilePath);
            console.log('[VOICE] Temp file deleted');
        } catch (err) {
            console.error('[VOICE] Delete failed:', err);
        }
    }
}