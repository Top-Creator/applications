import { BACKEND_URL } from '../env'
import { query } from './index'

export interface CookiesData {
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

export const getCookies = async (creatorId: string, token: string): Promise<CookiesData> => {
    const queryStr = `
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

    return query<CookiesData>(BACKEND_URL, token, queryStr, variables)
}
