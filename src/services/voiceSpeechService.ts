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
    console.log('[VOICE] Starte TTS für Text:', text);

    const audioFilePath = await generateSpeechFile(text);
    console.log('[VOICE] TTS-Datei erzeugt:', audioFilePath);

    const player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Stop,
        },
    });

    player.on('error', (error) => {
        console.error('[VOICE] Player-Fehler:', error);
    });

    try {
        const resource = createAudioResource(audioFilePath, {
            inlineVolume: true,
        });

        if (resource.volume) {
            resource.volume.setVolume(0.95);
        }

        const subscription = connection.subscribe(player);
        console.log('[VOICE] Subscription vorhanden:', Boolean(subscription));

        player.play(resource);
        console.log('[VOICE] Player.play(resource) aufgerufen');

        await entersState(player, AudioPlayerStatus.Playing, 10_000);
        console.log('[VOICE] Player ist im Status PLAYING');

        await entersState(player, AudioPlayerStatus.Idle, 60_000);
        console.log('[VOICE] Player ist wieder IDLE');
    } finally {
        player.stop();

        try {
            await unlink(audioFilePath);
            console.log('[VOICE] Temporäre TTS-Datei gelöscht');
        } catch (error) {
            console.error('[VOICE] Temporäre TTS-Datei konnte nicht gelöscht werden:', error);
        }
    }
}