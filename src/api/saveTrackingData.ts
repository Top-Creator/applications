import {BACKEND_URL} from '../env'

export const SAVE_TRACKING_DATA = `
  mutation ChangeChatterTrackingApp($input: ChangeChatterTrackingInput!) {
    changeChatterTrackingApp(input: $input){
        teamMemberId
      }
  }
`

export interface saveTrackingDataInput {
    teamMemberId: string
    msgsSent: number
    fansChatted: string
}

const saveTrackingData = async (input: saveTrackingDataInput, token: string) => {
    const requestData = {
        query: SAVE_TRACKING_DATA,
        variables: {
            input: input,
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
            console.log(response)
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

export default saveTrackingData
