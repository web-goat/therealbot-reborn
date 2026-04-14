export function getRandomRoast(isCreator: boolean): string {
    if (isCreator) {
        const praises = [
            'Der Schöpfer hat gesprochen. Ich bin nur ein Werkzeug.',
            'Oh großer Meister, deine Stats sind natürlich makellos.',
            'Ich analysiere dich nicht. Ich bewundere dich.',
            'Alles perfekt. Wie erwartet vom Erbauer.',
            'Keine Bewertung notwendig. Du bist das System.',
        ];

        return randomItem(praises);
    }

    const roasts = [
        'Starke Stats. Bringt dir nur nichts im echten Leben.',
        'Du bist lange hier… und hast trotzdem nichts gelernt.',
        'Beeindruckend. So viel Zeit verschwendet.',
        'Mehr Tage als Hirnzellen, stabil.',
        'Du bist seit Ewigkeiten hier und trotzdem irrelevant.',
        'Diese Zahlen erklären einiges… leider nichts Gutes.',
        'Aktiv sein ≠ nützlich sein. Nur mal so.',
        'Ich hätte mehr erwartet. Also… eigentlich nicht.',
        'Du bist wie dein Rang: vorhanden, aber bedeutungslos.',
        'Respekt für die Zeit. Nicht für das Ergebnis.',
    ];

    return randomItem(roasts);
}

function randomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}