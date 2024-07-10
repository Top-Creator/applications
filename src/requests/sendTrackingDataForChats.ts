import { chatActivityType } from '@features/trackingWindows/types'
import saveTrackingData from '../api/saveTrackingData'
import { BrowserWindow } from 'electron'


export const saveTrackingDataForChats = async (teamMemberId: string, chatActivities: chatActivityType, token: string, win: BrowserWindow) => {
    for (const [chatId, value] of chatActivities.entries()) {
        const input = {
            teamMemberId: teamMemberId,
            msgsSent: value.msgsSent - 1,
            fansChatted: chatId
        }

        try {
            const response = await saveTrackingData(input, token)
            console.log('Response:', response)
        } catch (error) {
            win.webContents.send('error', `Error saving tracking data: ${error}`)
            console.error('Error saving tracking data:', error)
        }
    }
}
