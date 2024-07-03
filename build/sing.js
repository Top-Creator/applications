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
        appBundleId: 'com.topcreator.app',
        appleId: 'subs@topcreator.com',
        appleIdPassword:'wxwu-weht-jxlm-raxh',
        teamId: 'S3J557W47A',
        tool: 'notarytool',
        appPath: `${appOutDir}/${appName}.app`,
    }).then(function () {
        console.log('ok notarize')
    })
}

module.exports = sing
