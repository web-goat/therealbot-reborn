export function getStatsFooterComment(options: {
    isCreator: boolean;
    visibleChannels: number;
    totalChannelsInGuild: number;
}): string {
    const { isCreator, visibleChannels, totalChannelsInGuild } = options;

    if (isCreator) {
        const creatorComments = [
            'Der Schöpfer hat gesprochen. Analyse abgeschlossen: makellos.',
            'Du bist nicht Teil des Systems. Du BIST das System.',
            'Stats vollständig göttlich. Wie erwartet.',
            'Keine Kritik. Nur Ehrfurcht.',
            'Ich urteile nicht über meinen Erschaffer. Ich knie.',
        ];

        return randomItem(creatorComments);
    }

    const visibilityRatio =
        totalChannelsInGuild > 0 ? visibleChannels / totalChannelsInGuild : 1;

    if (visibilityRatio < 0.35) {
        return 'Du siehst nicht mal genug Channels, um mitreden zu dürfen. Stark isoliert.';
    }

    if (visibilityRatio < 0.6) {
        return 'Du bekommst nur Teile des Servers mit. Quasi Nebencharakter mit Leserechten.';
    }

    const standardComments = [
        'Starke Stats. Bringt dir nur nichts im echten Leben.',
        'Beeindruckend. So viel Zeit verschwendet.',
        'Mehr Präsenz als Bedeutung, aber immerhin konstant.',
        'Du bist schon lange hier. Man merkt es leider.',
        'Respekt für die Ausdauer. Nicht für den Inhalt.',
        'Viele Tage, wenig Würde. Klassischer Serverbewohner.',
    ];

    return randomItem(standardComments);
}

function randomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}