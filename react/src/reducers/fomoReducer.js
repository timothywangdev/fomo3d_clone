const fomoReducer = (state = [], action) => {
  switch (action.type) {
  case 'FOMO_GET_DATA_PENDING':
    return {
      ...state,
      loading: true
    }
  case 'FOMO_GET_DATA_FULFILLED':
    return {
      ...state,
      ...action.payload
    }
  case 'FOMO_GET_DATA_REJECTED':
    return {
      ...state,
      error: 'GET_DATA_REJECTED'
    }
  default:
    return state
  }
}

export default fomoReducer
