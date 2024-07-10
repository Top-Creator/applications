import { BACKEND_URL } from '../env'
import { mutation } from './index'

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

export const saveTrackingData = async (input: saveTrackingDataInput, token: string) => {
    const variables = { input }

    return mutation<{ changeChatterTrackingApp: { teamMemberId: string } }>(BACKEND_URL, token, SAVE_TRACKING_DATA, variables)
}

export default saveTrackingData
