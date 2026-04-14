import type { Command } from '../types/command.js';
import { helpCommand } from '../commands/help.js';
import { pingCommand } from '../commands/ping.js';

const commands: Command[] = [
    pingCommand,
    helpCommand,
];

export const commandMap = new Map<string, Command>();

for (const command of commands) {
    commandMap.set(command.name, command);

    for (const alias of command.aliases ?? []) {
        commandMap.set(alias, command);
    }
}