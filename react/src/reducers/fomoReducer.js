const fomoReducer = (state = [], action) => {
  switch (action.type) {
    // GET_DATA
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
    // GET_BUY_PRICE
  case 'FOMO_GET_BUY_PRICE_PENDING':
    return {
      ...state
    }
  case 'FOMO_GET_BUY_PRICE_FULFILLED':
    return {
      ...state,
      ...action.payload
    }
  case 'FOMO_GET_BUY_PRICE_REJECTED':
    return {
      ...state,
      error: 'GET_GET_BUY_PRICE_REJECTED'
    }
  default:
    return state
  }
}

export default fomoReducer
