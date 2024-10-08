
export type onlyfansBrowserSessionType = Map<string, { sessions: trackedSessionType[], activities: trackedActivityType[] }>

export type chatActivityType = Set<string>


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
