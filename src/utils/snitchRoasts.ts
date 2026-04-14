const snitchRoasts = [
    'Stark. Erst schreiben, dann feige zurückrudern.',
    'Löschen ist auch nur Scheitern mit Extra-Schritten.',
    'Wer sowas löscht, hatte von Anfang an keine Überzeugung.',
    'Mut zur Nachricht, aber nicht zu den Konsequenzen. Schwach.',
    'Da wollte wohl jemand die Beweise verschwinden lassen.',
    'Digitaler Radiergummi, menschlich trotzdem überführt.',
    'Nachricht gelöscht, Ruf trotzdem ruiniert.',
    'Zu spät. TheRealBot sieht alles.',
    'Das Internet vergisst nie. Ich auch nicht.',
    'Gelöscht heißt nicht ungeschehen, du Legende.',
];

function randomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

export function getSnitchRoast(): string {
    return randomItem(snitchRoasts);
}