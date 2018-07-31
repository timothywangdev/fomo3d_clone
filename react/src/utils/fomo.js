import Utils from './utils.js'
import {BigNumber} from 'bignumber.js'
import { toast } from 'react-toastify'

function toBasicUnit (val) {
  let base = new BigNumber(10).pow(new BigNumber(18))
  let rv = new BigNumber(val).times(base)
  return rv
}

function notify (msg) {
  toast.success('Transaction Mined: ' + msg, {
    position: toast.POSITION.TOP_CENTER
  })
}

function notifyPendingTx () {
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
    let addr = await this.instance.token.call()
    this.token = await Utils.getToken(addr)
    this.tokenDecimals = 18
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
    return this.instance.getPlayerVaults.call(addr)
  }

  async getTokenAllowance (addr) {
    return this.token.allowance.call(addr, this.instance.address)
  }

  async getTokenBalance (addr) {
    return this.token.balanceOf.call(addr)
  }

  async approveToken (tokens) {
    let allowance = await this.getTokenAllowance(Utils.account)
    if (tokens.gt(allowance)) {
      // not enough allowance, approve more
      return this.token.approve((tokens.minus(allowance)).toString())
    }
  }

  async buy (affCode, team, tokens) {
    let allowance = await this.getTokenAllowance(Utils.account)
    console.log(allowance, tokens)
    if (tokens.gt(allowance)) {
      // enough allowance
      toast.error('Not enough tokens approved for transfer', {
        position: toast.POSITION.TOP_CENTER
      })
      return
    }
    await this.instance.buyXaddr(affCode, team, tokens.toString())
  }

  async iWantXKeys (keys) {
    return this.instance.iWantXKeys.call(keys.toString())
  }
}

export default new FomoService()
