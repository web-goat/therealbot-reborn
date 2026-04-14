export type AskResult =
    | {
    type: 'reply';
    content: string;
}
    | {
    type: 'forward';
    commandName: string;
};