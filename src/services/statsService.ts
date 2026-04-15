import {getUserMemoryStats, UserMemoryStatsRecord} from "../repositories/useMemoryRepository.js";

export interface StatsMemoryView {
    messagesSentCount: number;
    messagesDeletedCount: number;
    messagesEditedCount: number;
    botInteractionCount: number;
    memoryStartedAt: Date | null;
    lastMessageAt: Date | null;
    lastBotInteractionAt: Date | null;
}

function mapMemory(record: UserMemoryStatsRecord | null): StatsMemoryView {
    if (!record) {
        return {
            messagesSentCount: 0,
            messagesDeletedCount: 0,
            messagesEditedCount: 0,
            botInteractionCount: 0,
            memoryStartedAt: null,
            lastMessageAt: null,
            lastBotInteractionAt: null,
        };
    }

    return {
        messagesSentCount: record.messagesSentCount,
        messagesDeletedCount: record.messagesDeletedCount,
        messagesEditedCount: record.messagesEditedCount,
        botInteractionCount: record.botInteractionCount,
        memoryStartedAt: record.memoryStartedAt,
        lastMessageAt: record.lastMessageAt,
        lastBotInteractionAt: record.lastBotInteractionAt,
    };
}

export async function getStatsMemoryView(
    guildId: string,
    userId: string,
): Promise<StatsMemoryView> {
    const record = await getUserMemoryStats(guildId, userId);
    return mapMemory(record);
}