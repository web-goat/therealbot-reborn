export interface RankDefinition {
    level: number;
    title: string;
    maxDaysInclusive: number;
}

export interface RankResult {
    currentRank: RankDefinition;
    daysOnServer: number;
    nextRank: RankDefinition | null;
    daysUntilNextRank: number;
}

export const rankDefinitions: RankDefinition[] = [
    { level: 1, title: 'Neugeborener Hase', maxDaysInclusive: 100 },
    { level: 2, title: 'Slowly wachsender Rabbit', maxDaysInclusive: 183 },
    { level: 3, title: 'pubertierender Hase', maxDaysInclusive: 365 },
    { level: 4, title: '1 Year Jubiläumshase', maxDaysInclusive: 543 },
    { level: 5, title: 'Ausgewachsener Rabbit', maxDaysInclusive: 730 },
    { level: 6, title: 'Senior Rabbit', maxDaysInclusive: 913 },
    { level: 7, title: 'Alter Hasensack', maxDaysInclusive: 1095 },
    { level: 8, title: 'Veteranen-Rabbit', maxDaysInclusive: 1460 }, // 4 Jahre
    { level: 9, title: 'Legenden-Langohr', maxDaysInclusive: 1825 }, // 5 Jahre
    { level: 10, title: 'Mythischer Mümmelmeister', maxDaysInclusive: 2190 }, // 6 Jahre
    { level: 11, title: 'Unsterblicher Hopfenhase', maxDaysInclusive: 2555 }, // 7 Jahre
    { level: 12, title: 'Real Rabbit', maxDaysInclusive: 2999 },
    { level: 13, title: 'Server-Urgestein', maxDaysInclusive: Number.POSITIVE_INFINITY },
];

export function calculateDaysOnServer(joinedAt: Date): number {
    const now = Date.now();
    const joined = joinedAt.getTime();
    const diffMs = now - joined;

    return Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
}

export function getRankResult(joinedAt: Date): RankResult {
    const daysOnServer = calculateDaysOnServer(joinedAt);

    const currentRank =
        rankDefinitions.find((rank) => daysOnServer <= rank.maxDaysInclusive) ??
        rankDefinitions[rankDefinitions.length - 1];

    const currentIndex = rankDefinitions.findIndex(
        (rank) => rank.level === currentRank.level,
    );

    const nextRank =
        currentIndex >= 0 && currentIndex < rankDefinitions.length - 1
            ? rankDefinitions[currentIndex + 1]
            : null;

    const daysUntilNextRank =
        nextRank === null
            ? 0
            : Math.max(0, currentRank.maxDaysInclusive - daysOnServer + 1);

    return {
        currentRank,
        daysOnServer,
        nextRank,
        daysUntilNextRank,
    };
}

export function formatJoinDate(date: Date): string {
    return new Intl.DateTimeFormat('de-DE', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}