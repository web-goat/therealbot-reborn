export type AskResult =
    | {
    type: 'reply';
    content: string;
}
    | {
    type: 'reply_then_ai';
    content: string;
}
    | {
    type: 'reply_then_ai_current_info';
    content: string;
}
    | {
    type: 'forward';
    commandName: string;
};