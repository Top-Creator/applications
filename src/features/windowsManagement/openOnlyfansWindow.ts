import {ProxyData} from '../../preloads/mainWindowPreload'
import {getCookies} from '../../api/getCookies'
import {BrowserView, BrowserWindow, session} from 'electron'
import scrapCookies from '../../utils/scrapCookies'
import {SCRIPT_URL} from '../../env'
import {onlyfansWindowsType} from './types'
import {onlyfansBrowserSessionType} from '../trackingWindows/types'
import {handleActivity} from '../trackingWindows/trackingTime'
import {extractChatId} from '../trackingWindows/trackingChats'

export const  openOnlyfansWindow = async (args: { id?: string, proxyData?: ProxyData, token?: string, theme?: string }, onlyfansWindows: onlyfansWindowsType, win: BrowserWindow, browserViewsSession: onlyfansBrowserSessionType) => {

    const {data: cookiesData} = await getCookies(args.id, args.token)

    let newWindow: BrowserView

    const userAgent = cookiesData.getCreatorById.creatorAuth.user_agent
    const newSession: Electron.Session = session.fromPartition('persist:newOnlyfansSession')

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


    newSession.setProxy({proxyRules: proxyRules})
        .then(() => {

            newSession.webRequest.onBeforeSendHeaders((details, callback) => {
                details.requestHeaders['Proxy-Authorization'] = 'Basic ' + Buffer.from(`${proxyData.username}:${proxyData.password}`).toString('base64')
                callback({requestHeaders: details.requestHeaders})
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
            const trackedSessions = browserViewsSession.get(args.id)  || { sessions: [], activities: [], chats: new Set() }
            trackedSessions.sessions.push({ openTime: Date.now() })
            browserViewsSession.set(args.id, trackedSessions)

            newWindow.webContents.on('before-input-event', (event, input) => {
                if (input.type === 'keyDown') {
                    handleActivity(browserViewsSession, args.id, input.type)
                }
            })

            newWindow.webContents.session.webRequest.onCompleted({urls: ['*://onlyfans.com/*']}, async (details) => {
                if (details.statusCode === 200) {
                    handleActivity(browserViewsSession, args.id, 'request')
                }

                const regexForStories = /^https:\/\/onlyfans\.com\/api2\/v2\/stories/
                const regexForLogin = /^https:\/\/onlyfans\.com\/api2\/v2\/users\/login/

                if (regexForStories.test(details.url)) {
                    newWindow.webContents.loadURL('https://onlyfans.com/my/chats/')
                }

                if (regexForLogin.test(details.url) && details.statusCode === 200) {
                    setTimeout(() => scrapCookies(newSession, newWindow, args.token), 10 * 1000)
                }
            })

            // Логіка отримання id чата через трекінг надсилання повідомлення та підтвердження активності через активність в чаті
            newWindow.webContents.session.webRequest.onBeforeRequest( { urls: ['*://onlyfans.com/*/*/chats/*'] }, (details, callback) => {
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
                    browserViewsSession.get(args.id)?.chats.add(chatId)
                }
                callback({})
            })

            // Логіка для видалення поля bcTokenSha перед авторизацією
            newWindow.webContents.session.webRequest.onBeforeRequest({urls: ['*://onlyfans.com/api2/v2/users/login*']}, async (details, callback) => {
                newWindow.webContents.executeJavaScript('localStorage.removeItem("bcTokenSha")')
                    .then(() => {
                        callback({})
                    })
                    .catch(err => {
                        win.webContents.send('error', `Failed to clear localStorage before login ${err}`)
                        callback({})
                    })
            })

            newWindow.webContents.once('did-finish-load', async () => {
                // Видалення кукі
                await newSession.clearStorageData({storages: ['cookies']})

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

                // Логіка закінчення трекінсу сесій
                newWindow.webContents.on('destroyed', () => {
                    console.log('destroyed')
                    const viewSessions = browserViewsSession.get(args.id).sessions
                    if (viewSessions && viewSessions.length > 0) {
                        const currentSession = viewSessions[viewSessions.length - 1]
                        currentSession.closeTime = Date.now()
                    }
                })


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
                        
                        // Додавання стилів
                        const style = document.createElement('style');
                        
                        style.innerHTML = '.l-header__menu__item { display: none !important; }' +
                                           '.dropdown { display: none !important; }' +
                                           '.b-chat__subheader { display: none !important; }'+
                                           '.g-page__header__btn { display: none !important; }'+
                                           '.b-chat__message .g-avatar { display: none !important; }'+
                                            '.b-chats__item__btn-clear { display: none !important; }'+
                                            '.b-tabs__nav { display: none !important; }'+
                                            
                               '.b-chat__header__wrapper { display: none !important; }';
                              
                        // document.head.appendChild(style);
                 `)
                } catch (error) {
                    win.webContents.send('error', `Failed to set injection script: ${error.message}`)
                }
            })

            win.webContents.send('browser_started', args)

        })
        .catch(error => {
            console.error('Failed to set proxy for new window:', error)
            win.webContents.send('error', `Failed to set proxy for new window: ${error}`)
        })
}
