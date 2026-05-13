import {EndBehaviorType, type VoiceConnection} from '@discordjs/voice';
import type {GuildMember, VoiceBasedChannel} from 'discord.js';
import prism from 'prism-media';
import {mkdir, unlink, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createReadStream} from 'node:fs';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY?.trim();

if (!apiKey) {
    throw new Error('OPENAI_API_KEY fehlt');
}

const openai = new OpenAI({apiKey});

const STT_MODEL = process.env.OPENAI_STT_MODEL?.trim() || 'gpt-4o-mini-transcribe';
const MIN_PCM_BYTES = 8_000;
const TRANSCRIBE_TIMEOUT_MS = 8_000;

function createWavBuffer(pcm: Buffer, sampleRate = 48000, channels = 2): Buffer {
    const header = Buffer.alloc(44);
    const byteRate = sampleRate * channels * 2;

    header.write('RIFF', 0);
    header.writeUInt32LE(36 + pcm.length, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(channels * 2, 32);
    header.writeUInt16LE(16, 34);
    header.write('data', 36);
    header.writeUInt32LE(pcm.length, 40);

    return Buffer.concat([header, pcm]);
}

function destroyStream(stream: unknown): void {
    if (
        stream &&
        typeof stream === 'object' &&
        'destroy' in stream &&
        typeof stream.destroy === 'function'
    ) {
        stream.destroy();
    }
}

async function transcribeAudio(filePath: string): Promise<string> {
    const transcription = openai.audio.transcriptions.create({
        model: STT_MODEL,
        file: createReadStream(filePath),
        language: 'de',
        prompt: 'Discord Voice Chat, deutsch, kurze lockere Antworten, Gaming, Freunde.',
    });

    const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => {
            reject(new Error('Transcription timeout'));
        }, TRANSCRIBE_TIMEOUT_MS);
    });

    const result = await Promise.race([transcription, timeout]);

    return result.text?.trim() ?? '';
}

export async function listenForVoiceAnswer(input: {
    connection: VoiceConnection;
    channel: VoiceBasedChannel;
    botUserId: string;
    listenMs?: number;
}): Promise<{ speaker: GuildMember | null; text: string }> {
    const {connection, channel, botUserId, listenMs = 7_000} = input;
    const receiver = connection.receiver;

    return new Promise((resolve) => {
        let resolved = false;
        let activeOpusStream: NodeJS.ReadableStream | null = null;
        let activeDecoder: prism.opus.Decoder | null = null;

        const cleanup = () => {
            receiver.speaking.removeListener('start', onStart);

            destroyStream(activeOpusStream);
            destroyStream(activeDecoder);

            activeOpusStream = null;
            activeDecoder = null;
        };

        const finish = (speaker: GuildMember | null, text: string) => {
            if (resolved) {
                return;
            }

            resolved = true;

            clearTimeout(globalTimeout);

            cleanup();

            resolve({
                speaker,
                text,
            });
        };

        const globalTimeout = setTimeout(() => {
            console.log('[VOICE-LISTEN] Kein verwertbares Audio erkannt');
            finish(null, '');
        }, listenMs);

        const onStart = async (userId: string) => {
            if (resolved || activeOpusStream) {
                return;
            }

            if (userId === botUserId) {
                return;
            }

            const speaker = channel.members.get(userId);

            if (!speaker || speaker.user.bot) {
                return;
            }

            console.log('[VOICE-LISTEN] Speaker erkannt:', speaker.displayName);

            const opusStream = receiver.subscribe(userId, {
                end: {
                    behavior: EndBehaviorType.AfterSilence,
                    duration: 1_000,
                },
            });

            const decoder = new prism.opus.Decoder({
                rate: 48000,
                channels: 2,
                frameSize: 960,
            });

            activeOpusStream = opusStream;
            activeDecoder = decoder;

            const chunks: Buffer[] = [];

            const recordingTimeout = setTimeout(() => {
                if (resolved) {
                    return;
                }

                destroyStream(opusStream);

                if ('end' in decoder && typeof decoder.end === 'function') {
                    decoder.end();
                }
            }, Math.min(3_500, listenMs));

            decoder.on('data', (chunk: Buffer) => {
                chunks.push(chunk);
            });

            decoder.once('error', (error) => {
                console.error('[VOICE-LISTEN] Decoder Fehler:', error);

                clearTimeout(recordingTimeout);

                finish(null, '');
            });

            decoder.once('end', async () => {
                clearTimeout(recordingTimeout);

                if (resolved) {
                    return;
                }

                const pcm = Buffer.concat(chunks);

                console.log('[VOICE-LISTEN] PCM bytes:', pcm.length);

                if (pcm.length < MIN_PCM_BYTES) {
                    finish(speaker, '');
                    return;
                }

                const filePath = join(
                    process.cwd(),
                    'tmp',
                    `listen-${randomUUID()}.wav`,
                );

                try {
                    await mkdir(dirname(filePath), {
                        recursive: true,
                    });

                    await writeFile(
                        filePath,
                        createWavBuffer(pcm),
                    );

                    const text = await transcribeAudio(filePath);

                    console.log('[VOICE-LISTEN] Transkript:', text || '[leer]');

                    finish(speaker, text);
                } catch (error) {
                    console.error('[VOICE-LISTEN] Fehler:', error);

                    finish(speaker, '');
                } finally {
                    await unlink(filePath).catch(() => {
                    });
                }
            });

            opusStream.pipe(decoder);
        };

        receiver.speaking.on('start', onStart);
    });
}