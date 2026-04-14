import type { Command } from '../types/command.js';

const jokes = [
    {
        setup: 'Was ist grün und steht vor der Tür?',
        punchline: 'Ein Klopfsalat.',
    },
    {
        setup: 'Was ist braun, klebrig und läuft durch die Wüste?',
        punchline: 'Ein Karamel.',
    },
    {
        setup: 'Was ist weiß und guckt durchs Schlüsselloch?',
        punchline: 'Ein Spannbettlaken.',
    },
    {
        setup: 'Was steht auf dem Grabstein eines Mathelehrers?',
        punchline: 'Damit hat er nicht gerechnet.',
    },
    {
        setup: 'Egal wie gut du fährst …',
        punchline: 'Züge fahren Güter.',
    },

    // Erweiterung 😈
    {
        setup: 'Was ist orange und läuft durch den Wald?',
        punchline: 'Eine Wanderine.',
    },
    {
        setup: 'Was macht ein Pirat am Computer?',
        punchline: 'Er drückt die Enter-Taste.',
    },
    {
        setup: 'Warum können Seeräuber keinen Kreis berechnen?',
        punchline: 'Weil sie Pi raten.',
    },
    {
        setup: 'Was ist ein Keks unter einem Baum?',
        punchline: 'Ein schattiges Plätzchen.',
    },
    {
        setup: 'Warum können Geister so schlecht lügen?',
        punchline: 'Weil man durch sie hindurchsieht.',
    },
    {
        setup: 'Was ist rot und schlecht für die Zähne?',
        punchline: 'Ein Ziegelstein.',
    },
    {
        setup: 'Was ist gelb und kann nicht schwimmen?',
        punchline: 'Ein Bagger.',
    },
    {
        setup: 'Was macht ein Clown im Büro?',
        punchline: 'Faxen.',
    },
    {
        setup: 'Warum gehen Ameisen nicht in die Kirche?',
        punchline: 'Weil sie Insekten sind.',
    },
    {
        setup: 'Was ist klein, grün und dreieckig?',
        punchline: 'Ein kleines grünes Dreieck.',
    },
    {
        setup: 'Was ist groß, grau und egal?',
        punchline: 'Ein Irrelefant.',
    },
    {
        setup: 'Warum trinken Programmierer keinen Kaffee?',
        punchline: 'Weil sie lieber Java haben.',
    },
    {
        setup: 'Wie nennt man einen Bumerang, der nicht zurückkommt?',
        punchline: 'Stock.',
    },
    {
        setup: 'Was liegt am Strand und spricht undeutlich?',
        punchline: 'Eine Nuschel.',
    },
    {
        setup: 'Warum hat der Computer eine Brille?',
        punchline: 'Weil er Windows hat.',
    },
    {
        setup: 'Was ist schwarz-weiß und sitzt auf der Schaukel?',
        punchline: 'Ein Schwinguin.',
    },
    {
        setup: 'Warum können Skelette so schlecht lügen?',
        punchline: 'Weil sie nichts zu verbergen haben.',
    },
    {
        setup: 'Was macht ein Hai am Computer?',
        punchline: 'Er surft im Internet.',
    },
    {
        setup: 'Warum sind Fische so schlecht im Rechnen?',
        punchline: 'Weil sie ständig mit Netzen rechnen müssen.',
    },
    {
        setup: 'Was ist unsichtbar und riecht nach Karotten?',
        punchline: 'Ein Kaninchenfurz.',
    },
];

function randomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

export const jokeCommand: Command = {
    name: 'witz',
    aliases: ['witze', 'joke', 'flachwitz', 'flachwitze'],
    description: 'Erzählt einen Witz.',
    async execute(message) {
        const joke = randomItem(jokes);

        await message.reply(joke.setup);

        if (joke.punchline) {
            await message.reply(joke.punchline);
        }
    },
};