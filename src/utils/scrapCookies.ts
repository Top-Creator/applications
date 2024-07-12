import { BrowserView } from 'electron'
import updateCookies from '../api/updateCookies'

const scrapCookies = async (newSession: Electron.Session , newWindow: BrowserView, token: string) => {

    const cookies = await newSession.cookies.get({})

    const localStorageResult = await newWindow.webContents.executeJavaScript(`
            (function() {
                return {
                    localStorage: JSON.stringify(window.localStorage),
                    userAgent: navigator.userAgent
                };
            })();
        `)

    const localStorageData = JSON.parse(localStorageResult.localStorage)
    const userAgent = localStorageResult.userAgent


    updateCookies({
        input: {
            user_agent: userAgent || '',
            user_id: cookies.find((cookie) => cookie.name === 'auth_id')?.value || '',
            x_bc: localStorageData.bcTokenSha || '',
            cookie: cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; '),
            expiredAt: new Date(cookies.find((cookie) => cookie.name === 'sess')?.expirationDate * 1000).toISOString() || new Date().toISOString()
        },
        changeAppAuthAppInput2: {
            bcTokenSha: localStorageData.bcTokenSha || '',
            sess: cookies.find((cookie) => cookie.name === 'sess')?.value || '',
            user_id: cookies.find((cookie) => cookie.name === 'auth_id')?.value || ''
        }
    }, token).then(() => {
        console.log('Cookies updated')
    }).catch((err) => {
        console.log('Error updating cookies', err)
    })
}

export default scrapCookies
