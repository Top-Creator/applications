import { BACKEND_URL } from '../env'
import { query } from './index'

export interface InfoData {
        getInfoByTokenApp: {
            teamMemberId: string,
        }
}

export const getTeamMemberId = async (userId: string, token: string): Promise<InfoData> => {
    const queryStr = `
        query getInfoByTokenApp($user_id: String!) {
            getInfoByTokenApp(user_id: $user_id) {
                teamMemberId
            }
        }
    `

    const variables = {
        user_id: userId
    }

    return query<InfoData>(BACKEND_URL, token, queryStr, variables)
}
