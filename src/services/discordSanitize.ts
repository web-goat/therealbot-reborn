import {escapeMarkdown} from 'discord.js';

function neutralizeMentions(value: string): string {
    return value.replace(/@/g, '@\u200b');
}

export function sanitizeInlineText(value: string): string {
    return neutralizeMentions(escapeMarkdown(value));
}

export function sanitizeQuotedText(value: string): string {
    const sanitized = sanitizeInlineText(value).trim();

    if (!sanitized) {
        return '';
    }

    return sanitized
        .split(/\r?\n/g)
        .map((line) => `> ${line || ' '}`)
        .join('\n');
}