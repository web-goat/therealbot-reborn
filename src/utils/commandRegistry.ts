import type { Command } from '../types/command.js';
import { askCommand } from '../commands/ask.js';
import { autotalkCommand } from '../commands/autotalk.js';
import { helpCommand } from '../commands/help.js';
import { jokeCommand } from '../commands/joke.js';
import { pingCommand } from '../commands/ping.js';
import { wisdomCommand } from '../commands/wisdom.js';
import { rankCommand } from '../commands/rank.js';
import {statsCommand} from "../commands/stats.js";

const commands: Command[] = [
    pingCommand,
    helpCommand,
    askCommand,
    jokeCommand,
    wisdomCommand,
    autotalkCommand,
    rankCommand,
    statsCommand,
];

export const commandMap = new Map<string, Command>();

for (const command of commands) {
    commandMap.set(command.name, command);

    for (const alias of command.aliases ?? []) {
        commandMap.set(alias, command);
    }
}