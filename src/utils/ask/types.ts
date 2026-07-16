export type AskResult =
    | {
    type: 'reply';
    content: string;
}
    | {
    type: 'ai';
}
    | {
    type: 'forward';
    commandName: string;
};
