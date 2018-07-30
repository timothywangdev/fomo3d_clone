import { combineReducers } from 'redux'
import service from './service'
import fomoReducer from './fomoReducer'

export default combineReducers({
  service,
  fomoReducer
})
