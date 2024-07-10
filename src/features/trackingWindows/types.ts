
export type onlyfansBrowserSessionType = Map<string, { sessions: trackedSessionType[], activities: trackedActivityType[] }>

export type chatActivityType = Map<string, { msgsSent: number }>


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
}
