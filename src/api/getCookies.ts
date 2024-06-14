import {BACKEND_URL} from '../env'

interface CookiesData {
    data: {
        getCreatorById: {
            appAuth: {
                bcTokenSha: string
                sess: string
            },
            creatorAuth: {
                user_agent: string
                x_bc: string
                user_id: string
                cookie: string
                expiredAt: string
                isVerified: boolean
            }
        }
    }
}

export const getCookies = async (creatorId : string, token: string ):Promise<CookiesData> => {
    const query = `
  query GetCreatorById($creatorId: String) {
    getCreatorById(creatorId: $creatorId) {
      appAuth {
        bcTokenSha
        sess
      }
      creatorAuth {
        user_agent
        x_bc
        user_id
        cookie
        expiredAt
        isVerified
      }
    }
  }
`

    const variables = {
        creatorId: creatorId
    }

    const fetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            query: query,
            variables: variables
        })
    }


    const res  = await  fetch(BACKEND_URL, fetchOptions)

    return await res.json()
}