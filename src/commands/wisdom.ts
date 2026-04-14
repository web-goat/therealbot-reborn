import type { Command } from '../types/command.js';

const wisdoms = [
    'Nachts ist es kälter als draußen.',
    '7 Bier sind auch ein Schnitzel.',
    'Nüchtern betrachtet war es besoffen am besten.',
    'Das Leben ist viel zu kurz, um den USB-Stick sicher zu entfernen.',
    'Egal wie dicht du bist, Goethe war Dichter.',

    // Bierwaren Connaisseur Edition 🍺
    'Wer Bier trinkt hilft der Landwirtschaft.',
    'Ein Bier ist kein Bier, zwei sind ein Anfang.',
    'Man bereut nie das Bier, nur das, das man nicht getrunken hat.',
    'Bier auf Wein, das lass sein. Wein auf Bier, das rat ich dir – ist mir aber egal.',
    'Wenn du denkst es geht nicht mehr, kommt von irgendwo ein Bier daher.',
    'Durst ist schlimmer als Heimweh.',
    'Man kann Probleme nicht lösen, aber man kann sie sich schön trinken.',
    'Bier ist flüssiges Brot und ich bin auf Diät.',
    'Ich trinke nicht zu viel, ich trainiere nur meine Leber.',
    'Ein kluger Mann sagte mal nichts und ging ein Bier trinken.',
    'Wer arbeitet macht Fehler. Wer säuft liegt richtig.',
    'Realität ist nur eine Illusion verursacht durch Alkoholmangel.',
    'Ich hab nicht die Kontrolle verloren, ich hab sie bewusst abgegeben.',
    'Manchmal verliere ich Dinge… meistens meinen Pegel.',
    'Der Weg ist das Ziel, außer es geht zur Bar.',
    'Man sollte Probleme angehen – am besten mit einem Bier in der Hand.',
    'Wer den Tag mit Bier beginnt, hat ihn wenigstens richtig eingeschätzt.',
    'Bier ist keine Lösung… aber es macht die Fragen egal.',
    'Je mehr ich trinke, desto besser verstehe ich mich.',
    'Ich habe keinen Kater, ich habe einen emotionalen Support-Zustand.',
    'Das Glas ist nicht halb leer, es ist einfach schon wieder Zeit für Nachschub.',
    'Man trinkt nicht allein, man hat nur keine Zeugen.',
    'Ich wollte weniger trinken, aber ich bin kein Lügner.',
    'Bier verbindet – meistens mit dem Boden.',
];

function randomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

export const wisdomCommand: Command = {
    name: 'weisheit',
    aliases: ['weisheiten', 'erleuchtung', 'erleuchtemich'],
    description: 'Erleuchtet dich mit fragwürdiger Weisheit.',
    async execute(message) {
        const wisdom = randomItem(wisdoms);
        await message.reply(wisdom);
    },
};