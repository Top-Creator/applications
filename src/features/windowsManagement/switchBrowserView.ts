import {BrowserWindow} from 'electron'
import {onlyfansWindowsType} from './types'

export const  switchBrowserView  = async(id: string, theme: string, onlyfansWindows: onlyfansWindowsType, win: BrowserWindow)  =>{
    const view = onlyfansWindows.get(id)
    if (view) {
        win.setBrowserView(view)

        // Перевірка наявності dark_mode
        const darkModeExists = await view.webContents.executeJavaScript(`
           !localStorage.getItem('dark_mode')
        `)

        if (darkModeExists && theme === 'dark') {
            return
        }

        if (darkModeExists && theme === 'light') {
            view.webContents.executeJavaScript(`
                 localStorage.removeItem(${JSON.stringify('dark_mode')});
            `)
            view.webContents.reload()
        }

        if (!darkModeExists && theme === 'dark') {

            view.webContents.executeJavaScript(`
                 localStorage.setItem(${JSON.stringify('dark_mode')}, ${JSON.stringify('true')});
              `)
            view.webContents.reload()
        }

        if (!darkModeExists && theme === 'light') {
            return
        }

        const [mainWindowWidth, mainWindowHeight] = win.getSize()

        if (mainWindowWidth < 768) {
            view.setBounds({
                x: 0,
                y: 0,
                width: mainWindowWidth,
                height: mainWindowHeight - 112
            })
            view.webContents.setZoomFactor(1)
        } else {
            view.setBounds({
                x: 212,
                y: 0,
                width: mainWindowWidth - 212,
                height: mainWindowHeight
            })
            view.webContents.setZoomFactor((mainWindowWidth - 212) / mainWindowWidth)
        }
    } else {
        win.webContents.send('error', `BrowserView with id ${id} not found.`)
    }
}
