import OpenAI from 'openai';
import {mkdir, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {randomUUID} from 'node:crypto';

const apiKey = process.env.OPENAI_API_KEY?.trim();

if (!apiKey) {
    throw new Error('OPENAI_API_KEY fehlt');
}

const openai = new OpenAI({apiKey});

const TTS_MODEL = process.env.OPENAI_TTS_MODEL?.trim() || 'gpt-4o-mini-tts';

const AVAILABLE_VOICES = ['alloy', 'verse', 'luna', 'nova'];

function pickRandom<T>(items: readonly T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

function normalizeForSpeech(text: string): string {
    return text
        .replace(/[^\p{L}\p{N}\s.,!?]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function buildTempFilePath(): string {
    const filename = `tts-${randomUUID()}.mp3`;
    return join(process.cwd(), 'tmp', filename);
}

async function ensureTempDir(filePath: string): Promise<void> {
    await mkdir(dirname(filePath), {recursive: true});
}

export async function generateSpeechFile(text: string): Promise<string> {
    const cleanedText = normalizeForSpeech(text);

    if (!cleanedText) {
        throw new Error('Kein gültiger Text für TTS vorhanden');
    }

    console.log('[TTS] cleaned text:', cleanedText);

    const outputPath = buildTempFilePath();
    await ensureTempDir(outputPath);

    const voice = pickRandom(AVAILABLE_VOICES);

    console.log('[TTS] voice:', voice);
    console.log('[TTS] model:', TTS_MODEL);

    const response = await openai.audio.speech.create({
        model: TTS_MODEL,
        voice,
        input: cleanedText,
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    console.log('[TTS] buffer length:', buffer.length);

    await writeFile(outputPath, buffer);

    return outputPath;
}