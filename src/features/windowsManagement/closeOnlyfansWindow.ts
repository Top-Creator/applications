import {BrowserWindow} from 'electron'
import {onlyfansWindowsType} from './types'

export function closeOnlyfansWindow(id: string, onlyfansWindows:onlyfansWindowsType, win: BrowserWindow ) {
    if (onlyfansWindows.has(id)) {
        const window = onlyfansWindows.get(id)
        window.webContents.close()
        onlyfansWindows.delete(id)
        win.webContents.send('browser_closed', id)
    } else {
        win.webContents.send('error', `Window with id ${id} not found.`)
    }
}
