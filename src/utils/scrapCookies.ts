import { Browser, Cookie, Page } from 'puppeteer-core'
import updateCookies from '../api/updateCookies'

const scrapCookies = async (page: Page, browser: Browser, token: string) => {
    const localStorage = await page.evaluate(() =>  Object.assign({}, window.localStorage))
    const cookies: Cookie[] = await page.cookies()
    const userAgent = await browser.userAgent()
    updateCookies({
        input: {
            user_agent: userAgent || '',
            user_id: cookies.find((cookie) => cookie.name === 'auth_id')?.value || '',
            x_bc: localStorage.bcTokenSha,
            cookie: cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; '),
            expiredAt: new Date(cookies.find((cookie) => cookie.name === 'sess')?.expires * 1000).toISOString() || new Date().toISOString()
        },
        changeAppAuthAppInput2: {
            bcTokenSha: localStorage.bcTokenSha,
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
