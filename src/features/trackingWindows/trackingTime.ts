import {onlyfansBrowserSessionType, trackedActivityType,  TrackedTime} from './types'


function calculateActiveTime(activities: trackedActivityType[]) {
    let activeTime = 0
    let idleTime = 0
    let currentStart = null

    for (let i = 0; i < activities.length; i++) {
        const currentActivity = activities[i]
        const nextActivity = activities[i + 1]

        if (currentStart === null) {
            currentStart = currentActivity.timestamp
        }

        if (currentActivity.requestMade) {
            activeTime += (currentActivity.timestamp - currentStart) / 1000
            currentStart = currentActivity.timestamp
        }

        if (nextActivity) {
            const timeDiff = (nextActivity.timestamp - currentActivity.timestamp) / 1000
            if (timeDiff > 15) {
                idleTime += timeDiff
                currentStart = nextActivity.timestamp
            }
        } else {
            if (!currentActivity.requestMade) {
                idleTime += (currentActivity.timestamp - currentStart) / 1000
            }
        }
    }

    return { activeTime, idleTime }
}



export const getTrackedTimes =(browserViewsSessions):TrackedTime[] => {
    const trackedTimes = []

    browserViewsSessions.forEach((sessionData, id) => {
        const chatsIds = Array.from(sessionData.chats)
        const { activeTime, idleTime } = calculateActiveTime(sessionData.activities)
        const totalTime = (sessionData.sessions.reduce((total, session) => {
            if (session.closeTime) {
                return total + (session.closeTime - session.openTime)
            } else {
                return total + (Date.now() - session.openTime)
            }
        }, 0)) / 1000

        trackedTimes.push({ id, totalTime, activeTime, idleTime, chatsIds })
    })

    return trackedTimes
}


export function handleActivity(browserViewsSessions: onlyfansBrowserSessionType, id: string, type: string) {
    const activities = browserViewsSessions.get(id)?.activities


    if (activities) {
        activities.push({ timestamp: Date.now(), type, requestMade: false,  })
    }
}
