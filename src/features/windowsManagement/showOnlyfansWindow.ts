import { BrowserWindow } from 'electron'
import { hideOnlyfansWindows } from './hideOnlyfansWindows'
import { onlyfansWindowsType } from './types'

export const showOnlyfansWindow = (id:string, onlyfansWindows: onlyfansWindowsType, win: BrowserWindow) => {
    const view = onlyfansWindows.get(id)
    if (view) {
        hideOnlyfansWindows(onlyfansWindows, win)
        win.setBrowserView(view.BrowserView)

        const [mainWindowWidth, mainWindowHeight] = win.getSize()

        if (mainWindowWidth < 768) {
            view.BrowserView.setBounds({
                x: 0,
                y: 0,
                width: mainWindowWidth,
                height: mainWindowHeight - 112
            })
            view.BrowserView.webContents.setZoomFactor(1)
        } else {
            view.BrowserView.setBounds({
                x: 212,
                y: 0,
                width: mainWindowWidth - 212,
                height: mainWindowHeight
            })
            view.BrowserView.webContents.setZoomFactor((mainWindowWidth - 212) / mainWindowWidth)
        }
    } else {
        win.webContents.send('error', { error: `BrowserView with id ${id} not found}` , teamMemberId: view.teamMemberId })
    }
}
