import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { autoUpdater } from 'electron-updater'
import { openOnlyfansWindow } from '@features/windowsManagement/openOnlyfansWindow'
import { closeOnlyfansWindow } from '@features/windowsManagement/closeOnlyfansWindow'
import { closeAllOnlyfansWindows } from '@features/windowsManagement/closeAllOnlyfansWindows'
import { switchBrowserView } from '@features/windowsManagement/switchBrowserView'
import { showOnlyfansWindow } from '@features/windowsManagement/showOnlyfansWindow'
import { hideOnlyfansWindows } from '@features/windowsManagement/hideOnlyfansWindows'
import { setThemeWindow } from '@features/theme/setThemeWindow'
import { onlyfansWindowsType } from '@features/windowsManagement/types'
import { onlyfansBrowserSessionType } from '@features/trackingWindows/types'
import { FRONTEND_URL } from './env'

autoUpdater.autoDownload = true

let win = null as BrowserWindow
const onlyfansWindows: onlyfansWindowsType= new Map()
const browserViewsSession: onlyfansBrowserSessionType = new Map()

const createWindow = () => {

    win = new BrowserWindow({
        title: 'TopCreator',
        width: 1920,
        height: 1080,
        autoHideMenuBar: true,
        show: false,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname + '/preloads/mainWindowPreload.js'),
            devTools: false
        }
    })

    win.webContents.once('dom-ready', () => {
        win.show()
    })

    win.loadURL(FRONTEND_URL)

    win.on('close', () => {
        win = null
    })
}


app.on('ready', () => {
    createWindow()
    autoUpdater.checkForUpdatesAndNotify()
})

app.on('window-all-closed', () => {
    // const trackedTimes = getTrackedTimes(browserViewsSession)
    // console.log(trackedTimes)

    app.quit()
})


ipcMain.handle('open-onlyfans-window', async (_, args) => {
    await openOnlyfansWindow(args, onlyfansWindows, win ,browserViewsSession)
})

ipcMain.handle('close-onlyfans-window', async (_, args) => {
    closeOnlyfansWindow(args.id, onlyfansWindows, win)
})

ipcMain.handle('close-all-window', async () => {
    try {
        closeAllOnlyfansWindows(onlyfansWindows, win, browserViewsSession)
    } catch (err) {
        console.log(err)
    }

    // const trackedTimes = getTrackedTimes(browserViewsSession)
    // console.log(trackedTimes)
})

ipcMain.handle('switch-onlyfans-window', async (_, args) => {
    switchBrowserView(args.id, args.theme, onlyfansWindows, win)
})

ipcMain.handle('hide-onlyfans-windows', async () => {
    hideOnlyfansWindows(onlyfansWindows, win)
})

ipcMain.handle('show-onlyfans-window', async (_, args) => {
    showOnlyfansWindow(args.id, onlyfansWindows, win)
})

ipcMain.handle('set-dark-theme', async (_, args) => {
    setThemeWindow(args.id, args.theme, onlyfansWindows, win)
})

ipcMain.handle('error', async (_, err) => {
    win.webContents.send('error', err)
    return { err: 'error' }
})
