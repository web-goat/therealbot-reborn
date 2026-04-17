import type {Message} from 'discord.js';
import {buildAskContext} from './askContextService.js';
import {getAskResponse} from '../utils/ask/getAskResponse.js';
import {getInterjection} from '../utils/interjections.js';
import {generateAiAutotalkComment} from './askAiService.js';

function pickRandom<T>(items: readonly T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

function normalizeText(value: string): string {
    return value
        .normalize('NFKC')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function matchSocialInviteAutotalk(content: string): string | null {
    const text = normalizeText(content);

    if (!text) {
        return null;
    }

    const socialInvitePatterns = [
        'hat jemand bock',
        'hat wer bock',
        'wer hat bock',
        'jemand bock',
        'hat jemand lust',
        'hat wer lust',
        'wer hat lust',
        'jemand lust',
        'kommt jemand',
        'kommt wer',
        'wer kommt',
        'hat jemand zeit',
        'hat wer zeit',
        'jemand zeit',
        'jemand da',
        'wer spielt',
        'suche mate',
        'suche mates',
        'suche jemanden',
        'sucht jemand',
        'wer zockt',
        'wer spielt mit',
        'will jemand',
        'will wer',
        'wer ist dabei',
        'wer wäre dabei',
    ];

    const isInvite = socialInvitePatterns.some((pattern) => text.includes(pattern));

    if (!isInvite) {
        return null;
    }

    if (text.includes('fortnite')) {
        const responses = [
            'Fortnite spielen zu wollen ist schon mutig. Öffentlich danach zu fragen ist dann die Premium-Version der Verzweiflung.',
            'Nicht nur Fortnite, sondern auch noch aktiv nach Mitspielern fragen. Sozialer Tiefpunkt mit Battle Pass.',
            'Wer öffentlich nach Fortnite fragt, hat entweder Hoffnung oder wirklich zu wenig Freunde.',
            'Fortnite und Hilferuf in einem Satz. Du machst es mir heute wirklich leicht.',
            'Klar hat jemand Bock. Die eigentliche Frage ist nur, wer danach noch Selbstachtung übrig hat.',
        ];

        return pickRandom(responses);
    }

    if (text.includes('valorant')) {
        const responses = [
            'Öffentlich nach Valorant-Mates zu fragen ist hart. Aber immerhin nicht Fortnite.',
            'Valorant ist wenigstens technisch ein Spiel. Die Anfrage bleibt trotzdem leicht verzweifelt.',
            'Jemand sucht Valorant-Mitspieler. Man hört die Einsamkeit fast schon pingen.',
            'Valorant ist okay. Öffentlich nach Leuten fragen ist der eigentliche Mut-Test.',
        ];

        return pickRandom(responses);
    }

    if (text.includes('league of legends') || text.includes('lol')) {
        const responses = [
            'League spielen zu wollen ist schon fragwürdig. Dafür auch noch Gesellschaft zu suchen hat etwas Düsteres.',
            'LOL-Mitspieler suchen ist wie gemeinsam schlechte Entscheidungen planen.',
            'Jemand hat Bock auf LoL. Beeindruckend, wie offen man seelisches Leid bewerben kann.',
        ];

        return pickRandom(responses);
    }

    if (text.includes('minecraft')) {
        const responses = [
            'Minecraft ist als Einladung immerhin unschuldig. Deine soziale Bedürftigkeit strahlt trotzdem stark.',
            'Minecraft-Mitspieler suchen ist süß. Fast schon menschlich.',
            'Das ist erstaunlich wholesome dafür, dass es öffentlich formuliert wurde.',
        ];

        return pickRandom(responses);
    }

    if (text.includes('warzone') || text.includes('cod')) {
        const responses = [
            'Warzone-Mitspieler suchen ist die erwachsene Form von „bitte lass mich nicht allein“.',
            'Jemand will Warzone spielen und braucht dafür Zeugen. Verstanden.',
            'Öffentlich nach Warzone zu fragen klingt nach Stress mit Vorankündigung.',
        ];

        return pickRandom(responses);
    }

    if (text.includes('discord')) {
        const responses = [
            'Öffentlich nach Discord-Gesellschaft zu fragen ist schon ein indirekter Freundschaftstest.',
            'Jemand sucht Leute für Discord. Romantisch, wenn man Verzweiflung romantisch findet.',
            'Stark. Nicht mal ein Spiel als Vorwand. Einfach direkt soziale Bedürftigkeit ins Schaufenster.',
        ];

        return pickRandom(responses);
    }

    if (text.includes('zocken') || text.includes('spielen')) {
        const responses = [
            'Öffentlich nach Mitspielern zu fragen ist mutig. Oder einsam. Wahrscheinlich beides.',
            'Jemand sucht Gesellschaft zum Zocken. Ich höre einen Hilferuf mit RGB-Beleuchtung.',
            'So direkt nach Leuten zu fragen hat schon etwas Tragisches. Aber immerhin ehrlich.',
        ];

        return pickRandom(responses);
    }

    const genericResponses = [
        'Öffentlich nach Leuten zu fragen ist schon mutig. Ich wünsche dir viel Glück und wenig Würdeverlust.',
        'Das klingt nach einem sozialen Hilferuf mit leichtem Hoffnungsschimmer.',
        'Jemand will Aufmerksamkeit und idealerweise Gesellschaft. Beides nachvollziehbar, eins davon traurig.',
        'Ich respektiere die Offenheit. Nicht die Bedürftigkeit dahinter, aber die Offenheit.',
    ];

    return pickRandom(genericResponses);
}

function getGhostAskPrompts(content: string): string[] {
    const text = normalizeText(content);
    const prompts: string[] = [];

    if (
        text.includes('vincent') ||
        text.includes('realrabbit') ||
        text.includes('therealrabbit') ||
        text.includes('bierwaren connaisseur') ||
        text.includes('bierwarenconnaisseur')
    ) {
        prompts.push('wie findest du vincent');
    }

    if (
        text.includes('therealbot') ||
        text.includes('bot')
    ) {
        prompts.push('wer bist du');
    }

    if (
        text.includes('bier') ||
        text.includes('alkohol') ||
        text.includes('saufen') ||
        text.includes('sauf')
    ) {
        prompts.push('was hältst du von bier');
    }

    if (
        text.includes('liebe') ||
        text.includes('freundin') ||
        text.includes('romantik') ||
        text.includes('küssen') ||
        text.includes('daten')
    ) {
        prompts.push('was hältst du von liebe');
    }

    if (
        text.includes('warum') ||
        text.includes('wieso') ||
        text.includes('weshalb')
    ) {
        prompts.push('warum');
    }

    if (
        text.includes('wie') &&
        text.includes('?')
    ) {
        prompts.push('wie');
    }

    if (
        text.includes('wann')
    ) {
        prompts.push('wann');
    }

    if (
        text.includes('hilfe') ||
        text.includes('help')
    ) {
        prompts.push('kannst du helfen');
    }

    if (
        text.includes('witz')
    ) {
        prompts.push('erzähl einen witz');
    }

    if (
        text.includes('weisheit')
    ) {
        prompts.push('erleuchte mich');
    }

    return prompts;
}

function shouldUseAiAutotalk(message: Message): boolean {
    const text = normalizeText(message.content);

    if (!text || text.length < 18) {
        return false;
    }

    if (text.split(' ').length < 4) {
        return false;
    }

    const excludedHints = [
        'http',
        'https',
        'www',
        '.de',
        '.com',
        ':',
    ];

    if (excludedHints.some((hint) => message.content.includes(hint))) {
        return false;
    }

    return Math.random() < 0.18;
}

export async function getAutotalkResponse(message: Message): Promise<string | null> {
    if (!message.guild) {
        return null;
    }

    const socialInviteReaction = matchSocialInviteAutotalk(message.content);

    if (socialInviteReaction) {
        return socialInviteReaction;
    }

    const ghostPrompts = getGhostAskPrompts(message.content);

    if (ghostPrompts.length > 0) {
        const context = await buildAskContext(message);
        const prompt = pickRandom(ghostPrompts);
        const result = getAskResponse(message, prompt.split(/\s+/), context);

        if (result?.type === 'reply') {
            return result.content;
        }
    }

    const interjection = getInterjection(message.channel.id, message.content);

    if (interjection) {
        return interjection;
    }

    if (shouldUseAiAutotalk(message)) {
        const aiComment = await generateAiAutotalkComment(message);

        if (aiComment) {
            return aiComment;
        }
    }

    return null;
}