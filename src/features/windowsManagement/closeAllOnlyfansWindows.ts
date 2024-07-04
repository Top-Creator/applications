import {BrowserWindow} from 'electron'
import {onlyfansWindowsType} from './types'
import {onlyfansBrowserSessionType} from '../trackingWindows/types'


export const closeAllOnlyfansWindows = (onlyfansWindows:onlyfansWindowsType, win: BrowserWindow, browserViewsSession: onlyfansBrowserSessionType) => {
    onlyfansWindows.forEach((view, id) => {

        const viewSessions = browserViewsSession.get(id).sessions
        if (viewSessions && viewSessions.length > 0) {
            const currentSession = viewSessions[viewSessions.length - 1]
            currentSession.closeTime = Date.now()
        }

        if (view) {
            win.removeBrowserView(view)
            view.webContents.close()
            onlyfansWindows.delete(id)
            win.webContents.send('browser_closed', id)
        }
    })
}
