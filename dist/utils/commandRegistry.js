import { askCommand } from '../commands/ask.js';
import { helpCommand } from '../commands/help.js';
import { pingCommand } from '../commands/ping.js';
const commands = [
    pingCommand,
    helpCommand,
    askCommand,
];
export const commandMap = new Map();
for (const command of commands) {
    commandMap.set(command.name, command);
    for (const alias of command.aliases ?? []) {
        commandMap.set(alias, command);
    }
}
