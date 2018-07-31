const service = (state = [], action) => {
  switch (action.type) {
    case 'GET_DATA_PENDING':
      return {
        ...state,
        loading: true
      }
    case 'GET_DATA_FULFILLED':
      return {
        ...state,
        ...action.payload
      }
    case 'GET_DATA_REJECTED':
      return {
        ...state,
        error: 'GET_DATA_REJECTED'
      }
    case 'TOKENS_TO_RECEIVE_FULFILLED':
      return {
        ...state,
        tokensToReceive: action.payload
      }
    case 'TOKENS_TO_RECEIVE_REJECTED':
      return {
        ...state,
        error: 'TOKENS_TO_RECEIVE_REJECTED'
      }
    case 'ETH_TO_RECEIVE_FULFILLED':
      return {
        ...state,
        ethToReceive: action.payload
      }
    case 'ETH_TO_RECEIVE_REJECTED':
      return {
        ...state,
        error: 'ETH_TO_RECEIVE_REJECTED'
      }
    default:
      return state
  }
}

export default service
