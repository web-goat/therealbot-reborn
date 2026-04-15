export interface RecentAskInteraction {
    normalizedInput: string;
    responseType: string;
    responseContent: string;
    createdAt: Date;
}

export interface AskContext {
    hasAttachments: boolean;
    attachmentCount: number;
    hasMentions: boolean;
    isReply: boolean;
    recentInteractions: RecentAskInteraction[];
    lastNormalizedInput: string | null;
    lastResponseType: string | null;
    lastResponseContent: string | null;
}