import Utils from './utils.js'
import {BigNumber} from 'bignumber.js'
import { toast } from 'react-toastify'

function toBasicUnit(val) {
  let base = new BigNumber(10).pow(new BigNumber(18))
  let rv = new BigNumber(val).times(base)
  return rv
}

function notify(msg) {
  toast.success("Transaction Mined: "+msg, {
    position: toast.POSITION.TOP_CENTER
  })
}

function notifyPendingTx() {
  let msg = 'Tips: Check your pending transaction in your transaction history, which can be found either in your wallet App or Metamask.'
  toast(msg, {
    position: toast.POSITION.TOP_CENTER,
    autoClose: 8000
  })
}

class FomoService {
  constructor () {
    this.instance = null
  }

  async init () {
    this.instance = await Utils.getFomo()
  }

  getInstanceAddress () {
    return this.instance.address
  }

  async getCurrentRoundInfo () {
    return this.instance.getCurrentRoundInfo()
  }

  async exchangeRate () {
    return this.instance.exchangeRate.call()
  }

  async getTimeLeft () {
    return this.instance.getTimeLeft.call()
  }

  async getPlayerInfoByAddress (addr) {
    return this.instance.getPlayerInfoByAddress.call(addr)
  }

  async getPlayerVaults (addr) {
    return this.instance.getPlayerVaults(addr)
  }
}

export default new FomoService()

