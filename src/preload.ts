import {contextBridge, ipcRenderer} from 'electron'
import puppeteer, {Browser} from 'puppeteer-core'
import {BROWSER_URL, SCRIPT_URL} from './env'
import path from 'path'
import {getCookies} from './api/getCookies'
import scrapCookies from './utils/scrapCookies'

const browsers:Record<string, Browser> = {}

export interface ProxyData {
    host: string
    port: string
    userName: string
    password: string
}

contextBridge.exposeInMainWorld('electron', {
    openOnlyfans: async ({id, token, proxyData}: {
        id?: string,
        proxyData?: ProxyData,
        token?: string,

    }) => {

        const {data: cookiesData} = await getCookies(id, token)

        const proxyStrings = proxyData ? [
            `--proxy-server=${proxyData.host}:${proxyData.port}`
        ] : []

        try {
            const browser = await puppeteer.launch({
                headless: false,
                args: [
                    cookiesData.getCreatorById.creatorAuth.user_agent && cookiesData.getCreatorById.creatorAuth.user_agent !== 'null' ? `--user-agent=${cookiesData.getCreatorById.creatorAuth.user_agent}` : '',
                    ...proxyStrings,

                ],
                executablePath: (path.join(__dirname, BROWSER_URL))
            })

            browsers[id] = browser

            browser.on('disconnected', async () => {
                await ipcRenderer.invoke('browser_closed', id)
            })

            const [page] = await browser.pages()

            const localStorageData = {
                bcTokenSha: cookiesData.getCreatorById.creatorAuth.x_bc,
                cookiesAccepted: 'all',
                sess: cookiesData.getCreatorById.appAuth.sess,
                sessExpiration: cookiesData.getCreatorById.creatorAuth.expiredAt
            }

            await page.authenticate({
                username: proxyData.userName,
                password: proxyData.password
            })

            page.on('response', async response => {
                if (response.url().includes('onlyfans.com/api2/v2/users/login')) {
                    const status = response.status()

                    if (status === 200) {
                        setTimeout(() => scrapCookies(page, browsers[id], token), 10 * 1000)
                        scrapCookies(page,browser,token)
                    }
                }
            })

            await page.goto('https://onlyfans.com', {waitUntil: 'networkidle2'})
            await page.waitForSelector('.login-col')
            await page.deleteCookie()
            await page.setViewport({width: 0, height: 0, deviceScaleFactor: 1})

            await Promise.all([
                page.setCookie({
                    name: 'sess',
                    value: cookiesData.getCreatorById.appAuth?.sess || '' ,
                    domain: '.onlyfans.com',
                    path: '/',
                    secure: true,
                    httpOnly: false,
                    expires: new Date(cookiesData.getCreatorById.creatorAuth?.expiredAt).getTime()
                }),
                page.setCookie({
                    name: 'cookiesAccepted',
                    value: 'all',
                    domain: '.onlyfans.com',
                    path: '/',
                    secure: true,
                    httpOnly: false
                }),
                page.setCookie({
                    name: 'auth_id',
                    value: cookiesData.getCreatorById.creatorAuth?.user_id || '',
                    domain: '.onlyfans.com',
                    path: '/',
                    secure: true,
                    httpOnly: false
                }),
                page.setCookie({
                    name: 'InjectedToken',
                    value: token || '',
                    domain: '.onlyfans.com',
                    path: '/',
                    secure: true,
                    httpOnly: false
                })])

            for (const [key, value] of Object.entries(localStorageData)) {
                await page.evaluate((key, value) => {
                    console.log(key, value)
                    localStorage.setItem(key, value || '')
                }, key, value)
            }

            page.on('domcontentloaded', async () => {
                await page.addScriptTag({url: SCRIPT_URL})
            })

            await page.reload()
            await ipcRenderer.invoke('browser_started', id)
        } catch (error) {
            await ipcRenderer.invoke('error', error.message)
            await browsers[id].close()
            throw new Error(error.message)
        }
    },

    closeOnlyfans: async (id : string) => {
        await browsers[id].close()
    },

    onEvent: (eventName, callback) => {
        ipcRenderer.on(eventName, (event, data) => callback(data))
    },
    offEvent: (eventName, callback) => {
        ipcRenderer.removeListener(eventName, callback)
    }
})
