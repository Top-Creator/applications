import { BrowserWindow } from 'electron'
import { onlyfansWindowsType } from './types'

export function closeOnlyfansWindow(id: string, onlyfansWindows: onlyfansWindowsType, win: BrowserWindow) {
    const window = onlyfansWindows.get(id)
    window.BrowserView.webContents.close()
    onlyfansWindows.delete(id)
    win.webContents.send('browser_closed', { id, teamMemberId: window.teamMemberId })
}
