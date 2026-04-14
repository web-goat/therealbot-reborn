const editSnitchRoasts = [
    'Aha. Im Nachhinein doch noch Intelligenz simulieren wollen?',
    'Nachträgliches Umformulieren macht es nicht weniger peinlich.',
    'Stark. Erst senden, dann plötzlich Rechtschreibbewusstsein entwickeln.',
    'Zu spät. Die erste Version war schon ein Verbrechen.',
    'Nachträglich bearbeitet. Der digitale Walk of Shame.',
    'Da wollte wohl jemand seine Spuren schöner aussehen lassen.',
    'Bearbeiten ist auch nur Löschen mit Feigheit dazwischen.',
    'Ich habe die alte Version gesehen. Du kommst hier nicht raus.',
    'Schöner Versuch. Ich dokumentiere dein Scheitern trotzdem.',
    'Die überarbeitete Version ist vielleicht besser. Du bleibst es nicht.',
];

function randomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

export function getEditSnitchRoast(): string {
    return randomItem(editSnitchRoasts);
}