import type { Command } from '../types/command.js';

const intros = [
    'Na gut, dann bewerte ich dich mal.',
    'Wenn du sonst keine Probleme hast, bewerte ich dich eben.',
    'Meine Bewertung wird dich umhauen. Oder enttäuschen. Wahrscheinlich beides.',
    'Du willst also wirklich meine ehrliche Meinung hören? Gewagt.',
    'Warte kurz, ich empfange gerade göttliche Impulse über dein Dasein.',
    'Na schön. Du wolltest es ja nicht anders.',
    'Uff. Wenn es dein Selbstwertgefühl braucht, dann los.',
    'Ich hatte Besseres vor, aber jetzt bewerte ich halt dich.',
];

const judgments = [
    'Du bist ne absolut geile Sau!',
    'Du bist dumm. Aber mit Ausdauer.',
    'Bei dir ist Hopfen und Malz verloren.',
    'Bleib so wie du bist. Also bitte möglichst weit weg von mir.',
    'Mich wundert ehrlich gesagt, dass du es bis jetzt überlebt hast.',
    'Von allen Wesen in diesem Universum bist du überraschend durchschnittlich.',
    'Du bist schon ein süßer Knuffel. Leider auch seltsam.',
    'Man muss dich nicht leiden können. Ich tue es auch nicht.',
    'Du bist ein komischer Kauz.',
    'Charakter: 10. Aussehen: 10. Intelligenz: vom Praktikanten ausgewürfelt.',
    'Entzückend, wie dumm ein Mensch sein kann.',
    'Welch edles Gemüt du hast. Tragisch, dass der Rest nicht mithält.',
    'Du bist schon speziell. Leider nicht im guten Sinne.',
    'Ich würde dich nicht unterschätzen. Eher falsch einschätzen.',
];

function randomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

export const testmeCommand: Command = {
    name: 'testme',
    aliases: ['test', 'bewertemich'],
    description: 'Bewertet deine Wenigkeit mit unnötiger Härte.',
    async execute(message) {
        const intro = randomItem(intros);
        const judgment = randomItem(judgments);

        await message.reply(intro);
        await message.reply(`${message.member}, ${judgment}`);
    },
};