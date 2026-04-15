import {db} from '../db/client.js';
import type {RecentAskInteraction} from '../utils/ask/contextTypes.js';

export interface LogAskInteractionInput {
    guildId: string;
    channelId: string;
    userId: string;
    userTag: string;
    rawInput: string;
    normalizedInput: string;
    responseType: string;
    responseContent: string;
}

interface AskInteractionRow {
    normalized_input: string;
    response_type: string;
    response_content: string | null;
    created_at: Date;
}

export async function logAskInteraction(input: LogAskInteractionInput): Promise<void> {
    await db.query(
        `
            INSERT INTO ask_interactions (guild_id,
                                          channel_id,
                                          user_id,
                                          user_tag,
                                          raw_input,
                                          normalized_input,
                                          response_type,
                                          response_content)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
            input.guildId,
            input.channelId,
            input.userId,
            input.userTag,
            input.rawInput,
            input.normalizedInput,
            input.responseType,
            input.responseContent,
        ],
    );
}

export async function getRecentAskInteractionsForUser(
    guildId: string,
    userId: string,
    limit = 5,
): Promise<RecentAskInteraction[]> {
    const result = await db.query<AskInteractionRow>(
        `
            SELECT normalized_input,
                   response_type,
                   response_content,
                   created_at
            FROM ask_interactions
            WHERE guild_id = $1
              AND user_id = $2
            ORDER BY created_at DESC
                LIMIT $3
        `,
        [guildId, userId, limit],
    );

    return result.rows.map((row) => ({
        normalizedInput: row.normalized_input,
        responseType: row.response_type,
        responseContent: row.response_content ?? '',
        createdAt: row.created_at,
    }));
}