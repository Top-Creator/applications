import { BACKEND_URL } from '../env'
import { mutation } from './index'

export const SCRAP_COOKIES = `
  mutation ChangeCreatorAuthByApp($input: ChangeCreatorAuthInput $changeAppAuthAppInput2: AppDataAppInput) {
  changeCreatorAuthByApp(input: $input)
  changeAppAuthApp(input: $changeAppAuthAppInput2)
}`


export interface ScrapCookiesInputType {
    input: {
        user_agent: string
        user_id: string
        x_bc: string
        cookie: string
        expiredAt: string
    }
    changeAppAuthAppInput2: {
        user_id: string
        sess: string
        bcTokenSha: string
    }
}

export const updateCookies = async (vars: ScrapCookiesInputType, token: string) => {
    const variables = {
        input: vars.input,
        changeAppAuthAppInput2: vars.changeAppAuthAppInput2
    }

    return mutation<{ changeCreatorAuthByApp, changeAppAuthApp }>(BACKEND_URL, token, SCRAP_COOKIES, variables)
}

export default updateCookies

