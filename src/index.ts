import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import dotenv from 'dotenv'
import {FRONTEND_URL} from './env'
import { autoUpdater}  from 'electron-updater'
import todesktop  from '@todesktop/runtime'


todesktop.init()

dotenv.config()
autoUpdater.autoDownload = true

let win = null as BrowserWindow

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
            preload: path.join(__dirname + '/preload.js')
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
    app.quit()
})


ipcMain.handle('browser_started', async (_, args) => {
    win.webContents.send('browser_started', args)
    return { status: 'success' }
})

ipcMain.handle('browser_closed', async (_, args) => {
    win.webContents.send('browser_closed', args)
    return { status: 'success'}
})

ipcMain.handle('error', async (_, err) => {
    win.webContents.send('error', err)
    return { err: 'error'}
})