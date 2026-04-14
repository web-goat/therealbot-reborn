export function normalizeInput(args) {
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
