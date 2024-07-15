import { ProxyData } from '@preloads/mainWindowPreload'
import { getCookies } from '@api/getCookies'
import { BrowserView, BrowserWindow, session } from 'electron'
import scrapCookies from '../../utils/scrapCookies'
import { onlyfansWindowsType } from './types'
import { chatActivityType, onlyfansBrowserSessionType } from '../trackingWindows/types'
import { handleActivity } from '../trackingWindows/trackingTime'
import { extractChatId } from '../trackingWindows/trackingChats'
import { getTeamMemberId } from '@api/getInfoByToken'
import { saveTrackingDataForChats } from '@requests/sendTrackingDataForChats'
import { SCRIPT_URL } from '../../env'

export const openOnlyfansWindow = async (args: { id?: string, proxyData?: ProxyData, token?: string, theme?: string, isUserOwnerTeam: boolean }, onlyfansWindows: onlyfansWindowsType, win: BrowserWindow, browserViewsSession: onlyfansBrowserSessionType) => {

    const chatActivity:chatActivityType = new Map()
    const cookiesData = await getCookies(args.id, args.token)

    const userTeamData = await  getTeamMemberId(cookiesData.getCreatorById.creatorAuth.user_id , args.token)

    let newWindow: BrowserView

    const userAgent = cookiesData.getCreatorById.creatorAuth.user_agent
    const newSession: Electron.Session = session.fromPartition(`persist:newOnlyfansSession + ${args.id}`, { cache: false })

    if (userAgent && userAgent !== 'null') {
        newSession.setUserAgent(userAgent)
    }

    const proxyData = {
        host: args.proxyData.host,
        port: args.proxyData.port,
        username: args.proxyData.userName,
        password: args.proxyData.password
    }

    const localStorageData = {
        bcTokenSha: cookiesData.getCreatorById.creatorAuth.x_bc,
        cookiesAccepted: 'all',
        sess: cookiesData.getCreatorById.appAuth.sess,
        sessExpiration: cookiesData.getCreatorById.creatorAuth.expiredAt
    }

    const proxyRules = `http=${proxyData.host}:${proxyData.port};https=${proxyData.host}:${proxyData.port}`


    newSession.setProxy({ proxyRules: proxyRules })
        .then(() => {

            newSession.webRequest.onBeforeSendHeaders((details, callback) => {
                details.requestHeaders['Proxy-Authorization'] = 'Basic ' + Buffer.from(`${proxyData.username}:${proxyData.password}`).toString('base64')
                callback({ requestHeaders: details.requestHeaders })
            })

            newWindow = new BrowserView({
                webPreferences: {
                    session: newSession,
                    nodeIntegration: false,
                    contextIsolation: true,
                    devTools: false
                }
            })

            win.setBrowserView(newWindow)
            const [mainWindowWidth, mainWindowHeight] = win.getSize()

            if (mainWindowWidth < 768) {
                newWindow.setBounds({
                    x: 0,
                    y: 0,
                    width: mainWindowWidth,
                    height: mainWindowHeight - 112
                })
                newWindow.webContents.setZoomFactor(1)
            } else {
                newWindow.setBounds({
                    x: 212,
                    y: 0,
                    width: mainWindowWidth - 212,
                    height: mainWindowHeight
                })
                newWindow.webContents.setZoomFactor((mainWindowWidth - 212) / mainWindowWidth)
            }

            onlyfansWindows.set(args.id, newWindow)


            win.on('resize', () => {
                const [mainWindowWidth, mainWindowHeight] = win.getSize()

                if (mainWindowWidth < 768) {
                    newWindow.setBounds({
                        x: 0,
                        y: 0,
                        width: mainWindowWidth,
                        height: mainWindowHeight - 112
                    })
                } else {
                    newWindow.setBounds({
                        x: 212,
                        y: 0,
                        width: mainWindowWidth - 212,
                        height: mainWindowHeight
                    })
                }
            })

            newWindow.webContents.on('login', (event, request, authInfo, callback) => {
                if (authInfo.isProxy) {
                    event.preventDefault()
                    callback(proxyData.username, proxyData.password)
                }
            })

            newWindow.webContents.loadURL('https://onlyfans.com')

            // Логіка для трекінсу старту сессій
            const trackedSessions = browserViewsSession.get(args.id)  || { sessions: [], activities: [] }
            trackedSessions.sessions.push({ openTime: Date.now() })
            browserViewsSession.set(args.id, trackedSessions)

            newWindow.webContents.on('before-input-event', (event, input) => {
                if (input.type === 'keyDown') {
                    handleActivity(browserViewsSession, args.id, input.type)
                }
            })

            //Логіка отримання id чата через трекінг надсилання повідомлення та підтвердження активності через активність в чаті
            newWindow.webContents.session.webRequest.onCompleted({ urls: ['*://onlyfans.com/*'] }, async (details) => {
                if (details.statusCode === 200) {
                    handleActivity(browserViewsSession, args.id, 'request')
                }

                const regexForStories = /^https:\/\/onlyfans\.com\/api2\/v2\/stories/
                const regexForLogin = /^https:\/\/onlyfans\.com\/api2\/v2\/users\/login/
                const regexForChats = /^https:\/\/onlyfans\.com\/api2\/v2\/chats\//
                const regexCheckVisitToOtherAccount = /^https:\/\/onlyfans\.com\/api2\/v2\/users\/profile\/visit/

                const regexCheckStatsOtherAccount = /^https:\/\/onlyfans\.com\/api2\/v2\/users\/profile\/stats-collect/

                if (regexCheckStatsOtherAccount.test(details.url) && !args.isUserOwnerTeam  ) {
                    newWindow.webContents.loadURL('https://onlyfans.com/my/chats/')
                }

                if (regexCheckVisitToOtherAccount.test(details.url) && !args.isUserOwnerTeam  ) {
                    newWindow.webContents.loadURL('https://onlyfans.com/my/chats/')
                }

                if (regexForStories.test(details.url) && !args.isUserOwnerTeam  ) {
                    newWindow.webContents.loadURL('https://onlyfans.com/my/chats/')
                }

                if (regexForLogin.test(details.url) && details.statusCode === 200) {
                    setTimeout(() => scrapCookies(newSession, newWindow, args.token),1000)
                }

                if (regexForChats.test(details.url)) {
                    const chatId = extractChatId(details.url)

                    const activities = browserViewsSession.get(args.id)?.activities
                    const timeApprovalActivity = 2 * 60 * 1000 // 2 min

                    if (activities) {
                        const currentTime = Date.now()

                        activities.forEach(activity => {
                            if (currentTime - activity.timestamp <= timeApprovalActivity) {
                                activity.requestMade = true
                            }
                        })
                    }

                    if (chatId) {
                        if (chatActivity.has(chatId)) {
                            let msgsSent = chatActivity.get(chatId).msgsSent
                            msgsSent++
                            chatActivity.set(chatId,  { msgsSent: msgsSent })
                        } else {
                            chatActivity.set(chatId, { msgsSent: 1 })
                        }
                    }
                }

            })

            newWindow.webContents.on('did-finish-load', async () => {
                // Видалення кукі
                await newSession.clearStorageData({ storages: ['cookies'] })
                await newSession.clearStorageData({ storages: ['localstorage'] })

                // Встановлення кукі
                await Promise.all([
                    newSession.cookies.set({
                        url: 'https://onlyfans.com',
                        name: 'sess',
                        value: cookiesData.getCreatorById.appAuth?.sess || '',
                        domain: '.onlyfans.com',
                        path: '/',
                        secure: true,
                        httpOnly: false,
                        expirationDate: new Date(cookiesData.getCreatorById.creatorAuth?.expiredAt).getTime() / 1000
                    }),
                    newSession.cookies.set({
                        url: 'https://onlyfans.com',
                        name: 'cookiesAccepted',
                        value: 'all',
                        domain: '.onlyfans.com',
                        path: '/',
                        secure: true,
                        httpOnly: false
                    }),
                    newSession.cookies.set({
                        url: 'https://onlyfans.com',
                        name: 'auth_id',
                        value: cookiesData.getCreatorById.creatorAuth?.user_id || '',
                        domain: '.onlyfans.com',
                        path: '/',
                        secure: true,
                        httpOnly: false
                    }),
                    newSession.cookies.set({
                        url: 'https://onlyfans.com',
                        name: 'InjectedToken',
                        value: args.token || '',
                        domain: '.onlyfans.com',
                        path: '/',
                        secure: true,
                        httpOnly: false
                    }),
                    newSession.cookies.set({
                        url: 'https://onlyfans.com',
                        name: 'fp',
                        value: cookiesData.getCreatorById.creatorAuth?.x_bc || '',
                        domain: '.onlyfans.com',
                        path: '/',
                        secure: true,
                        httpOnly: false
                    })
                ])

                // Встановлення localStorage
                for (const [key, value] of Object.entries(localStorageData)) {
                    await newWindow.webContents.executeJavaScript(`
                        localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)});
                    `)
                }

                // Перевірка наявності dark_mode
                const darkModeExists = await newWindow.webContents.executeJavaScript(`
                    !!localStorage.getItem('dark_mode')
                `)

                if (darkModeExists) {
                    win.webContents.send('is_dark_theme')
                }

                if (darkModeExists && args.theme === 'light') {
                    newWindow.webContents.executeJavaScript(`
                           localStorage.removeItem(${JSON.stringify('dark_mode')});
                        `)
                }

                if (!darkModeExists && args.theme === 'dark') {
                    newWindow.webContents.executeJavaScript(`
                        localStorage.setItem(${JSON.stringify('dark_mode')}, ${JSON.stringify('true')});
                     `)
                }

                // Перезавантаження сторінки
                newWindow.webContents.reload()

            })

            newWindow.webContents.on('dom-ready', async () => {
                // Додавання скрипту
                try {
                    const scriptUrl = `${SCRIPT_URL}`
                    newWindow.webContents.executeJavaScript(`
                        (function() {
                            const script = document.createElement('script');
                            script.src = '${scriptUrl}';
                            script.async = true;
                            document.head.appendChild(script);
                        })();
                        
                 ` )

                    newWindow.webContents.executeJavaScript(`
                        const styleBase = document.createElement('style');
                        
                        styleBase.innerHTML =  '.b-reminder-form {  display: none !important; }'+
                                            '.b-chat__messages {  height: 66% !important; flex: unset !important; }'+
                                             '.b-make-post__textarea-wrapper {  max-height: 100px !important; overflow: auto !important; }'+

                          document.head.appendChild(styleBase);
                 ` )

                    //Додавання скрипту для видалення всіх стилів якщо це не овнер акаунту
                    !args.isUserOwnerTeam && newWindow.webContents.executeJavaScript(` 
                    // Додавання стилів
                        const styleLimitation = document.createElement('style');
                        
                        styleLimitation.innerHTML = '.l-header__menu__item { display: none !important; }' +
                                           '.dropdown { display: none !important; }' +
                                           '.b-chat__message .g-avatar { display: none !important; }'+
                                           '.g-page__header__btn { display: none !important; }'+
                                            '.b-chats__item__btn-clear { display: none !important; }'+
                                             '.b-chat__messages {  height: 65% !important; flex: unset !important; }'+
                                            '.b-tabs__nav { display: none !important; }' + 
                                             '.b-make-post__textarea-wrapper {  max-height: 120px !important; overflow: auto !important; }';

                          document.head.appendChild(styleLimitation);
                        `)
                } catch (error) {
                    win.webContents.send('error', `Failed to set injection script: ${error.message}`)
                }
            })

            // Логіка закінчення трекінсу сесій
            newWindow.webContents.on('destroyed', async () => {

                if (chatActivity.size > 0) {
                    await saveTrackingDataForChats(userTeamData.getInfoByTokenApp.teamMemberId, chatActivity, args.token , win)

                }


                const viewSessions = browserViewsSession.get(args.id).sessions
                if (viewSessions && viewSessions.length > 0) {
                    const currentSession = viewSessions[viewSessions.length - 1]
                    currentSession.closeTime = Date.now()
                }
            })

            win.webContents.send('browser_started', args)

        })
        .catch(error => {
            console.error('Failed to set proxy for new window:', error)
            win.webContents.send('error', `Failed to set proxy for new window: ${error}`)
        })
}
