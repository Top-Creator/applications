import { BrowserWindow } from 'electron'
import { onlyfansWindowsType } from '../windowsManagement/types'

export const setThemeWindow = (id: string, theme: string, onlyfansWindows: onlyfansWindowsType, win: BrowserWindow) => {
    if (onlyfansWindows.has(id)) {
        const window = onlyfansWindows.get(id).BrowserView

        if (theme === 'dark') {
            window.webContents.executeJavaScript(`
                        localStorage.setItem(${JSON.stringify('dark_mode')}, ${JSON.stringify('true')});
        `)
            window.webContents.reload()
        }
        if (theme === 'light') {
            window.webContents.executeJavaScript(`
                        localStorage.removeItem(${JSON.stringify('dark_mode')});
            `)
            window.webContents.reload()
        }

        window.webContents.loadURL('https://onlyfans.com')

    } else {
        win.webContents.send('error', `Window with id ${id} not found.`)
    }
}
