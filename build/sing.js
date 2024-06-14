const { signAsync } = require('@electron/osx-sign')
const {notarize} =  require ('@electron/notarize')

async function sing(context) {
    const {electronPlatformName, appOutDir} = context
    if (electronPlatformName !== 'darwin') {
        return
    }

    const appName = context.packager.appInfo.productFilename

    await  signAsync({
        app: `${appOutDir}/${appName}.app`
    })
        .then(function () {
            console.log('ok signAsync')
        })
        .catch(function (err) {
            console.log(err)
        })

    await notarize({
        appBundleId: 'com.topcreator.application',
        appleId: 'topcreatorcom@gmail.com',
        appleIdPassword:'lscj-joph-cjzm-mxzb',
        teamId: 'BGUC5BMT7Y',
        tool: 'notarytool',
        appPath: `${appOutDir}/${appName}.app`,
    }).then(function () {
        console.log('ok notarize')
    })
}

module.exports = sing
