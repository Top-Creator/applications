import { BACKEND_URL } from '../env'

export interface InfoData {
    data: {
        getInfoByTokenApp: {
            teamMemberId: string,
        }
    }
}

export const getTeamMemberId = async (user_id: string, token: string): Promise<InfoData> => {
    const query = `
        query getInfoByTokenApp($user_id: String!) {
            getInfoByTokenApp(user_id: $user_id) {
                teamMemberId
            }
        }
    `

    const variables = {
        user_id: user_id
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

    return await fetch(BACKEND_URL, fetchOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok')
            }

            return response.json()
        })
        .then(data => {
            if (data.errors) {
                console.error('GraphQL errors:', data.errors)
                throw new Error(data.errors.map((error: any) => error.message).join(', '))
            }
            return data
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error)
            throw error
        })
}
