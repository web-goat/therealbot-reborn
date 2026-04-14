export interface NormalizedAskInput {
    raw: string;
    cleaned: string;
    words: string[];
}

export function normalizeInput(args: string[]): NormalizedAskInput {
    const raw = args.join(' ').trim();

    const cleaned = raw
        .normalize('NFKC')
        .replace(/[^\p{L}\p{N}\s]/gu, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

    const words = cleaned.length > 0 ? cleaned.split(' ') : [];

    return {
        raw,
        cleaned,
        words,
    };
}