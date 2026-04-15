import {db} from '../db/client.js';

export interface TrackedMessageRecord {
    messageId: string;
    guildId: string;
    channelId: string;
    channelName: string;
    userId: string;
    userTag: string;
    content: string;
    createdAt: Date;
    updatedAt: Date | null;
    deletedAt: Date | null;
    editCount: number;
    isDeleted: boolean;
}

interface MessageRow {
    message_id: string;
    guild_id: string;
    channel_id: string;
    channel_name: string | null;
    user_id: string;
    user_tag: string | null;
    content: string;
    created_at: Date;
    updated_at: Date | null;
    deleted_at: Date | null;
    edit_count: number;
    is_deleted: boolean;
}

export interface SaveTrackedMessageInput {
    messageId: string;
    guildId: string;
    channelId: string;
    channelName: string;
    userId: string;
    userTag: string;
    content: string;
    createdAt: Date;
}

function mapRow(row: MessageRow): TrackedMessageRecord {
    return {
        messageId: row.message_id,
        guildId: row.guild_id,
        channelId: row.channel_id,
        channelName: row.channel_name ?? 'unbekannt',
        userId: row.user_id,
        userTag: row.user_tag ?? 'unbekannt',
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
        editCount: row.edit_count,
        isDeleted: row.is_deleted,
    };
}

export async function saveTrackedMessage(input: SaveTrackedMessageInput): Promise<void> {
    await db.query(
        `
        INSERT INTO tracked_messages (
            message_id,
            guild_id,
            channel_id,
            channel_name,
            user_id,
            user_tag,
            content,
            created_at,
            updated_at,
            deleted_at,
            edit_count,
            is_deleted
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL, NULL, 0, FALSE)
        ON CONFLICT (message_id)
        DO UPDATE SET
            guild_id = EXCLUDED.guild_id,
            channel_id = EXCLUDED.channel_id,
            channel_name = EXCLUDED.channel_name,
            user_id = EXCLUDED.user_id,
            user_tag = EXCLUDED.user_tag,
            content = EXCLUDED.content,
            created_at = EXCLUDED.created_at,
            updated_at = NULL,
            deleted_at = NULL,
            edit_count = 0,
            is_deleted = FALSE
        `,
        [
            input.messageId,
            input.guildId,
            input.channelId,
            input.channelName,
            input.userId,
            input.userTag,
            input.content,
            input.createdAt,
        ],
    );
}

export async function getTrackedMessageById(messageId: string): Promise<TrackedMessageRecord | null> {
    const result = await db.query<MessageRow>(
        `
        SELECT
            message_id,
            guild_id,
            channel_id,
            channel_name,
            user_id,
            user_tag,
            content,
            created_at,
            updated_at,
            deleted_at,
            edit_count,
            is_deleted
        FROM tracked_messages
        WHERE message_id = $1
        LIMIT 1
        `,
        [messageId],
    );

    const row = result.rows[0];
    return row ? mapRow(row) : null;
}

export async function markTrackedMessageDeleted(messageId: string, deletedAt: Date): Promise<TrackedMessageRecord | null> {
    const result = await db.query<MessageRow>(
        `
        UPDATE tracked_messages
        SET
            deleted_at = $2,
            is_deleted = TRUE
        WHERE message_id = $1
        RETURNING
            message_id,
            guild_id,
            channel_id,
            channel_name,
            user_id,
            user_tag,
            content,
            created_at,
            updated_at,
            deleted_at,
            edit_count,
            is_deleted
        `,
        [messageId, deletedAt],
    );

    const row = result.rows[0];
    return row ? mapRow(row) : null;
}

export async function updateTrackedMessageContent(
    messageId: string,
    nextContent: string,
    updatedAt: Date,
): Promise<{ previous: TrackedMessageRecord; current: TrackedMessageRecord } | null> {
    const previous = await getTrackedMessageById(messageId);

    if (!previous) {
        return null;
    }

    const result = await db.query<MessageRow>(
        `
        UPDATE tracked_messages
        SET
            content = $2,
            updated_at = $3,
            edit_count = edit_count + 1,
            is_deleted = FALSE
        WHERE message_id = $1
        RETURNING
            message_id,
            guild_id,
            channel_id,
            channel_name,
            user_id,
            user_tag,
            content,
            created_at,
            updated_at,
            deleted_at,
            edit_count,
            is_deleted
        `,
        [messageId, nextContent, updatedAt],
    );

    const row = result.rows[0];

    if (!row) {
        return null;
    }

    return {
        previous,
        current: mapRow(row),
    };
}