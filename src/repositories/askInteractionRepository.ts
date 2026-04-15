import {db} from '../db/client.js';

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

export async function logAskInteraction(input: LogAskInteractionInput): Promise<void> {
    await db.query(
        `
        INSERT INTO ask_interactions (
            guild_id,
            channel_id,
            user_id,
            user_tag,
            raw_input,
            normalized_input,
            response_type,
            response_content
        )
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