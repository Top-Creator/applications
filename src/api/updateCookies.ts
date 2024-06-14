import {BACKEND_URL} from '../env'

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

const updateCookies = async (vars: ScrapCookiesInputType, token: string) => {
    const requestData = {
        query: SCRAP_COOKIES,
        variables: {
            input: vars.input,
            changeAppAuthAppInput2: vars.changeAppAuthAppInput2
        }
    }

    return fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok')
            }
            return response.json()
        })
        .then(data => {
            return data
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error)
            throw error
        })
}

export default updateCookies
