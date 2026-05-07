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

async function transcribeAudio(filePath: string): Promise<string> {
    const result = await openai.audio.transcriptions.create({
        model: STT_MODEL,
        file: createReadStream(filePath),
        language: 'de',
        prompt: 'Discord Voice Chat, deutsch, kurze lockere Antworten.',
    });

    return result.text?.trim() ?? '';
}

export async function listenForVoiceAnswer(input: {
    connection: VoiceConnection;
    channel: VoiceBasedChannel;
    botUserId: string;
    listenMs?: number;
}): Promise<{ speaker: GuildMember | null; text: string }> {
    const {connection, channel, botUserId, listenMs = 6_000} = input;
    const receiver = connection.receiver;

    return new Promise((resolve) => {
        let resolved = false;

        const finish = (speaker: GuildMember | null, text: string) => {
            if (resolved) return;

            resolved = true;
            clearTimeout(timeout);
            receiver.speaking.removeListener('start', onStart);
            resolve({speaker, text});
        };

        const timeout = setTimeout(() => finish(null, ''), listenMs);

        const onStart = async (userId: string) => {
            if (resolved || userId === botUserId) return;

            const speaker = channel.members.get(userId);

            if (!speaker || speaker.user.bot) {
                return;
            }

            const opusStream = receiver.subscribe(userId, {
                end: {
                    behavior: EndBehaviorType.AfterSilence,
                    duration: 1_200,
                },
            });

            const decoder = new prism.opus.Decoder({
                rate: 48000,
                channels: 2,
                frameSize: 960,
            });

            const chunks: Buffer[] = [];

            decoder.on('data', (chunk: Buffer) => {
                chunks.push(chunk);
            });

            decoder.once('end', async () => {
                if (resolved) return;

                const pcm = Buffer.concat(chunks);

                if (pcm.length < 8_000) {
                    return;
                }

                const filePath = join(process.cwd(), 'tmp', `listen-${randomUUID()}.wav`);

                try {
                    await mkdir(dirname(filePath), {recursive: true});
                    await writeFile(filePath, createWavBuffer(pcm));

                    const text = await transcribeAudio(filePath);

                    if (text) {
                        finish(speaker, text);
                    }
                } catch (error) {
                    console.error('[VOICE-LISTEN] Fehler:', error);
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