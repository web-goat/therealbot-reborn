import {db} from '../db/client.js';

export interface UserMemoryStatsRecord {
    guildId: string;
    userId: string;
    userTag: string;
    messagesSentCount: number;
    messagesDeletedCount: number;
    messagesEditedCount: number;
    botInteractionCount: number;
    memoryStartedAt: Date;
    lastMessageAt: Date | null;
    lastBotInteractionAt: Date | null;
}

interface UserMemoryRow {
    guild_id: string;
    user_id: string;
    user_tag: string | null;
    messages_sent_count: number;
    messages_deleted_count: number;
    messages_edited_count: number;
    bot_interaction_count: number;
    memory_started_at: Date;
    last_message_at: Date | null;
    last_bot_interaction_at: Date | null;
}

function mapRow(row: UserMemoryRow): UserMemoryStatsRecord {
    return {
        guildId: row.guild_id,
        userId: row.user_id,
        userTag: row.user_tag ?? 'unbekannt',
        messagesSentCount: row.messages_sent_count,
        messagesDeletedCount: row.messages_deleted_count,
        messagesEditedCount: row.messages_edited_count,
        botInteractionCount: row.bot_interaction_count,
        memoryStartedAt: row.memory_started_at,
        lastMessageAt: row.last_message_at,
        lastBotInteractionAt: row.last_bot_interaction_at,
    };
}

async function ensureUserMemoryRow(guildId: string, userId: string, userTag: string): Promise<void> {
    await db.query(
        `
        INSERT INTO user_memory_stats (
            guild_id,
            user_id,
            user_tag
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (guild_id, user_id)
        DO UPDATE SET
            user_tag = EXCLUDED.user_tag
        `,
        [guildId, userId, userTag],
    );
}

export async function incrementMessagesSent(
    guildId: string,
    userId: string,
    userTag: string,
    lastMessageAt: Date,
): Promise<void> {
    await ensureUserMemoryRow(guildId, userId, userTag);

    await db.query(
        `
        UPDATE user_memory_stats
        SET
            user_tag = $3,
            messages_sent_count = messages_sent_count + 1,
            last_message_at = $4
        WHERE guild_id = $1 AND user_id = $2
        `,
        [guildId, userId, userTag, lastMessageAt],
    );
}

export async function incrementMessagesDeleted(
    guildId: string,
    userId: string,
    userTag: string,
): Promise<void> {
    await ensureUserMemoryRow(guildId, userId, userTag);

    await db.query(
        `
        UPDATE user_memory_stats
        SET
            user_tag = $3,
            messages_deleted_count = messages_deleted_count + 1
        WHERE guild_id = $1 AND user_id = $2
        `,
        [guildId, userId, userTag],
    );
}

export async function incrementMessagesEdited(
    guildId: string,
    userId: string,
    userTag: string,
): Promise<void> {
    await ensureUserMemoryRow(guildId, userId, userTag);

    await db.query(
        `
        UPDATE user_memory_stats
        SET
            user_tag = $3,
            messages_edited_count = messages_edited_count + 1
        WHERE guild_id = $1 AND user_id = $2
        `,
        [guildId, userId, userTag],
    );
}

export async function incrementBotInteractionCount(
    guildId: string,
    userId: string,
    userTag: string,
    interactedAt: Date,
): Promise<void> {
    await ensureUserMemoryRow(guildId, userId, userTag);

    await db.query(
        `
        UPDATE user_memory_stats
        SET
            user_tag = $3,
            bot_interaction_count = bot_interaction_count + 1,
            last_bot_interaction_at = $4
        WHERE guild_id = $1 AND user_id = $2
        `,
        [guildId, userId, userTag, interactedAt],
    );
}

export async function getUserMemoryStats(
    guildId: string,
    userId: string,
): Promise<UserMemoryStatsRecord | null> {
    const result = await db.query<UserMemoryRow>(
        `
        SELECT
            guild_id,
            user_id,
            user_tag,
            messages_sent_count,
            messages_deleted_count,
            messages_edited_count,
            bot_interaction_count,
            memory_started_at,
            last_message_at,
            last_bot_interaction_at
        FROM user_memory_stats
        WHERE guild_id = $1 AND user_id = $2
        LIMIT 1
        `,
        [guildId, userId],
    );

    const row = result.rows[0];
    return row ? mapRow(row) : null;
}