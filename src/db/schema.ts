export const databaseSchemaStatements = [
    `
    CREATE TABLE IF NOT EXISTS tracked_messages (
        message_id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        channel_name TEXT,
        user_id TEXT NOT NULL,
        user_tag TEXT,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ,
        deleted_at TIMESTAMPTZ,
        edit_count INTEGER NOT NULL DEFAULT 0,
        is_deleted BOOLEAN NOT NULL DEFAULT FALSE
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS user_memory_stats (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_tag TEXT,
        messages_sent_count INTEGER NOT NULL DEFAULT 0,
        messages_deleted_count INTEGER NOT NULL DEFAULT 0,
        messages_edited_count INTEGER NOT NULL DEFAULT 0,
        bot_interaction_count INTEGER NOT NULL DEFAULT 0,
        memory_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_message_at TIMESTAMPTZ,
        last_bot_interaction_at TIMESTAMPTZ,
        PRIMARY KEY (guild_id, user_id)
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS ask_interactions (
        id BIGSERIAL PRIMARY KEY,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_tag TEXT,
        raw_input TEXT NOT NULL,
        normalized_input TEXT NOT NULL,
        response_type TEXT NOT NULL,
        response_content TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
    `,
    `
    CREATE INDEX IF NOT EXISTS idx_tracked_messages_user_guild
    ON tracked_messages (guild_id, user_id)
    `,
    `
    CREATE INDEX IF NOT EXISTS idx_ask_interactions_user_guild
    ON ask_interactions (guild_id, user_id)
    `,
];