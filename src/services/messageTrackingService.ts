import type {Message} from 'discord.js';
import {
    getTrackedMessageById,
    markTrackedMessageDeleted,
    saveTrackedMessage,
    updateTrackedMessageContent,
} from '../repositories/messageRepository.js';
import {
    incrementMessagesDeleted,
    incrementMessagesEdited,
    incrementMessagesSent
} from "../repositories/useMemoryRepository.js";


function getChannelName(message: Message): string {
    return 'name' in message.channel
        ? message.channel.name ?? 'unbekannt'
        : 'unbekannt';
}

export async function trackCreatedMessage(message: Message<true>): Promise<void> {
    const content = message.content.trim();

    if (!content) {
        return;
    }

    await saveTrackedMessage({
        messageId: message.id,
        guildId: message.guild.id,
        channelId: message.channel.id,
        channelName: getChannelName(message),
        userId: message.author.id,
        userTag: message.author.tag,
        content,
        createdAt: new Date(message.createdTimestamp),
    });

    await incrementMessagesSent(
        message.guild.id,
        message.author.id,
        message.author.tag,
        new Date(message.createdTimestamp),
    );
}

export async function trackDeletedMessage(messageId: string): Promise<{
    guildId: string;
    authorId: string;
    authorTag: string;
    channelName: string;
    content: string;
} | null> {
    const tracked = await getTrackedMessageById(messageId);

    if (!tracked) {
        return null;
    }

    const deleted = await markTrackedMessageDeleted(messageId, new Date());

    if (!deleted) {
        return null;
    }

    await incrementMessagesDeleted(
        deleted.guildId,
        deleted.userId,
        deleted.userTag,
    );

    return {
        guildId: deleted.guildId,
        authorId: deleted.userId,
        authorTag: deleted.userTag,
        channelName: deleted.channelName,
        content: deleted.content,
    };
}

export async function trackUpdatedMessage(message: Message<true>): Promise<{
    guildId: string;
    authorId: string;
    authorTag: string;
    channelName: string;
    previousContent: string;
    nextContent: string;
} | null> {
    const nextContent = message.content.trim();

    if (!nextContent) {
        return null;
    }

    const updated = await updateTrackedMessageContent(
        message.id,
        nextContent,
        new Date(),
    );

    if (!updated) {
        return null;
    }

    const previousContent = updated.previous.content.trim();

    if (!previousContent || previousContent === nextContent) {
        return null;
    }

    await incrementMessagesEdited(
        updated.current.guildId,
        updated.current.userId,
        updated.current.userTag,
    );

    return {
        guildId: updated.current.guildId,
        authorId: updated.current.userId,
        authorTag: updated.current.userTag,
        channelName: updated.current.channelName,
        previousContent,
        nextContent,
    };
}