import OpenAI from 'openai';
import {mkdir, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

const apiKey = process.env.OPENAI_API_KEY?.trim();

if (!apiKey) {
    throw new Error('OPENAI_API_KEY fehlt');
}

const openai = new OpenAI({apiKey});

const TTS_MODEL = process.env.OPENAI_TTS_MODEL?.trim() || 'gpt-4o-mini-tts';

const AVAILABLE_VOICES = [
    'marin',
    'cedar',
    'verse',
    'ash',
    'alloy',
    'sage',
] as const;

function pickRandom<T>(items: readonly T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

function normalizeForSpeech(value: string): string {
    return value
        .replace(/<@!?\d+>/g, '')
        .replace(/[*_~`>|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function buildTempFilePath(): string {
    const fileName = `therealbot-tts-${Date.now()}-${crypto.randomUUID()}.mp3`;
    return path.join(os.tmpdir(), 'therealbot-tts', fileName);
}

async function ensureTempDir(filePath: string): Promise<void> {
    await mkdir(path.dirname(filePath), {recursive: true});
}

export async function generateSpeechFile(text: string): Promise<string> {
    const cleanedText = normalizeForSpeech(text);

    if (!cleanedText) {
        throw new Error('Kein gültiger Text für TTS vorhanden');
    }

    const outputPath = buildTempFilePath();
    await ensureTempDir(outputPath);

    const voice = pickRandom(AVAILABLE_VOICES);

    const response = await openai.audio.speech.create({
        model: TTS_MODEL,
        voice,
        input: cleanedText,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(outputPath, buffer);

    return outputPath;
}