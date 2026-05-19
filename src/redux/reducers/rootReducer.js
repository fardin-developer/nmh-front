import { profileData, infoData } from './reducer'
import { combineReducers } from 'redux'

const rootReducer = combineReducers({ profileData, infoData })

export default rootReducer