const enabledChannelIds = new Set<string>();

export const autotalkConfig = {
    randomChance: 0.3,
    cooldownMs: 10_000,
};

export function enableAutotalkForChannel(channelId: string): void {
    enabledChannelIds.add(channelId);
}

export function disableAutotalkForChannel(channelId: string): void {
    enabledChannelIds.delete(channelId);
}

export function isAutotalkEnabledForChannel(channelId: string): boolean {
    return enabledChannelIds.has(channelId);
}

export function getEnabledAutotalkChannelCount(): number {
    return enabledChannelIds.size;
}