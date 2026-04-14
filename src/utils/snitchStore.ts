interface CachedMessage {
    authorId: string;
    authorTag: string;
    channelId: string;
    channelName: string;
    content: string;
    createdAt: number;
}

const messageCache = new Map<string, CachedMessage>();
const MAX_CACHE_SIZE = 1000;

export function cacheMessage(input: {
    messageId: string;
    authorId: string;
    authorTag: string;
    channelId: string;
    channelName: string;
    content: string;
    createdAt: number;
}): void {
    if (!input.content.trim()) return;

    if (messageCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = messageCache.keys().next().value;

        if (oldestKey) {
            messageCache.delete(oldestKey);
        }
    }

    messageCache.set(input.messageId, {
        authorId: input.authorId,
        authorTag: input.authorTag,
        channelId: input.channelId,
        channelName: input.channelName,
        content: input.content,
        createdAt: input.createdAt,
    });
}

export function getCachedMessage(messageId: string): CachedMessage | null {
    return messageCache.get(messageId) ?? null;
}

export function deleteCachedMessage(messageId: string): void {
    messageCache.delete(messageId);
}