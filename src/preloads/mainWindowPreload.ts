import { contextBridge, ipcRenderer } from 'electron'

export interface ProxyData {
    host: string
    port: string
    userName: string
    password: string
}

contextBridge.exposeInMainWorld('electron', {
    openOnlyfans: async ({ id, token, proxyData,widthSidebar, theme, isUserOwnerTeam }: {
        id?: string,
        proxyData?: ProxyData,
        token?: string,
        widthSidebar?: number,
        theme?: string,
        isUserOwnerTeam?: boolean
    }) => {
        try {
            await ipcRenderer.invoke('open-onlyfans-window', { id, proxyData,token, widthSidebar, theme, isUserOwnerTeam })
        } catch (error) {
            await ipcRenderer.invoke('error', error.message)
            await ipcRenderer.invoke('close-onlyfans-window', { id })
            throw new Error(error.message)
        }
    },

    closeOnlyfans: async (id : string) => {
        await ipcRenderer.invoke('close-onlyfans-window', { id })
    },

    closeAllWindows: async () => {
        await ipcRenderer.invoke('close-all-window')
    },

    hideOnlyfansWindows: async () => {
        await ipcRenderer.invoke('hide-onlyfans-windows')
    },

    showOnlyfansWindow: async ( id : string) => {
        await ipcRenderer.invoke('show-onlyfans-window', { id })
    },


    setAppTheme: async (id:string, theme: string) => {
        await ipcRenderer.invoke('set-dark-theme', { id, theme })
    },

    switchOnlyfansWindow: async (id : string ,theme:string) => {
        try {
            await ipcRenderer.invoke('switch-onlyfans-window', { id, theme })
        } catch (error) {
            await ipcRenderer.invoke('error', error.message)
            throw new Error(error.message)
        }
    },

    onEvent: (eventName, callback) => {
        ipcRenderer.on(eventName, (event, data) => callback(data))
    },
    offEvent: (eventName, callback) => {
        ipcRenderer.removeListener(eventName, callback)
    }
})
