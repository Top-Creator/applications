
export type onlyfansBrowserSessionType = Map<string, { sessions: trackedSessionType[], activities: trackedActivityType[], chats: Set<string> }>

export interface trackedActivityType {
    timestamp: number;
    type: string;
    requestMade: boolean;
}

export interface trackedSessionType {
    openTime: number;
    closeTime?: number;
}

export interface TrackedTime {
    id: string;
    totalTime: number;
    activeTime: number;
    idleTime: number;
    chatsIds: string[]
}
