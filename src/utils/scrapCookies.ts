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
        input : {
            ...(userAgent !== 'null' && { user_agent: userAgent }),
            ...(cookies.find(cookie => cookie.name === 'auth_id')?.value !== 'null' && { user_id: cookies.find(cookie => cookie.name === 'auth_id').value }),
            ...(localStorageData.bcTokenSha !== 'null' && { x_bc: localStorageData.bcTokenSha }),
            ...(cookies.length > 0 && { cookie: cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ') }),
            ...(cookies.find(cookie => cookie.name === 'sess') && { expiredAt: new Date(cookies.find(cookie => cookie.name === 'sess').expirationDate * 1000).toISOString() || new Date().toISOString() })
        },

        changeAppAuthAppInput2 : {
            ...(localStorageData.bcTokenSha !== 'null' && { bcTokenSha: localStorageData.bcTokenSha }),
            ...(cookies.find(cookie => cookie.name === 'sess')?.value !== 'null' && { sess: cookies.find(cookie => cookie.name === 'sess').value }),
            ...(cookies.find(cookie => cookie.name === 'auth_id')?.value !== 'null' && { user_id: cookies.find(cookie => cookie.name === 'auth_id').value })
        }
    }, token).then(() => {
        console.log('Cookies updated')
    }).catch((err) => {
        console.log('Error updating cookies', err)
    })
}

export default scrapCookies
