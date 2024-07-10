import { BrowserWindow } from 'electron'
import { onlyfansWindowsType } from './types'

export const hideOnlyfansWindows = (onlyfansWindows: onlyfansWindowsType, win: BrowserWindow) => {
    onlyfansWindows.forEach((view) => {
        win.removeBrowserView(view)
    })
}
