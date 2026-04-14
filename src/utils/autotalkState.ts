import { readJsonFile, writeJsonFile } from './fileStore.js';

interface AutotalkStateData {
    enabledChannelIds: string[];
    randomChance: number;
    cooldownMs: number;
}

const AUTOTALK_STATE_FILE = 'autotalk-state.json';

const defaultState: AutotalkStateData = {
    enabledChannelIds: [],
    randomChance: 0.3,
    cooldownMs: 10_000,
};

let state: AutotalkStateData = { ...defaultState };
let initialized = false;

export async function initializeAutotalkState(): Promise<void> {
    if (initialized) return;

    const fileState = await readJsonFile<AutotalkStateData>(
        AUTOTALK_STATE_FILE,
        defaultState,
    );

    state = {
        enabledChannelIds: Array.isArray(fileState.enabledChannelIds)
            ? fileState.enabledChannelIds
            : [],
        randomChance:
            typeof fileState.randomChance === 'number'
                ? fileState.randomChance
                : defaultState.randomChance,
        cooldownMs:
            typeof fileState.cooldownMs === 'number'
                ? fileState.cooldownMs
                : defaultState.cooldownMs,
    };

    initialized = true;
}

async function persistState(): Promise<void> {
    await writeJsonFile(AUTOTALK_STATE_FILE, state);
}

export function getAutotalkConfig(): { randomChance: number; cooldownMs: number } {
    return {
        randomChance: state.randomChance,
        cooldownMs: state.cooldownMs,
    };
}

export function isAutotalkEnabledForChannel(channelId: string): boolean {
    return state.enabledChannelIds.includes(channelId);
}

export function getEnabledAutotalkChannelCount(): number {
    return state.enabledChannelIds.length;
}

export async function enableAutotalkForChannel(channelId: string): Promise<void> {
    if (!state.enabledChannelIds.includes(channelId)) {
        state.enabledChannelIds.push(channelId);
        await persistState();
    }
}

export async function disableAutotalkForChannel(channelId: string): Promise<void> {
    const nextIds = state.enabledChannelIds.filter((id) => id !== channelId);

    if (nextIds.length !== state.enabledChannelIds.length) {
        state.enabledChannelIds = nextIds;
        await persistState();
    }
}

export async function setAutotalkChance(percent: number): Promise<void> {
    state.randomChance = percent / 100;
    await persistState();
}

export async function setAutotalkCooldown(seconds: number): Promise<void> {
    state.cooldownMs = seconds * 1000;
    await persistState();
}