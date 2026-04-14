import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dataDir = path.resolve(process.cwd(), 'data');

export async function ensureDataDir(): Promise<void> {
    await mkdir(dataDir, { recursive: true });
}

export async function readJsonFile<T>(fileName: string, fallback: T): Promise<T> {
    await ensureDataDir();

    const filePath = path.join(dataDir, fileName);

    try {
        const content = await readFile(filePath, 'utf-8');
        return JSON.parse(content) as T;
    } catch {
        return fallback;
    }
}

export async function writeJsonFile<T>(fileName: string, data: T): Promise<void> {
    await ensureDataDir();

    const filePath = path.join(dataDir, fileName);
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}