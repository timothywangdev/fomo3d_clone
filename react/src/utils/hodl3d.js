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

class Hodl3dService {
  constructor () {
    this.instance = null
  }

  async init () {
    this.instance = await Utils.getHodl3D()
  }

  getInstanceAddress () {
    return this.instance.address
  }

  async tokenSupply () {
    return await this.instance.totalSupply.call()
  }

  async totalEthereumBalance () {
    return await this.instance.totalEthereumBalance.call()
  }

  async balanceOf (address) {
    return await this.instance.balanceOf.call(address)
  }

  async myDividends (includeReferralBonus) {
    return await this.instance.myDividends.call(includeReferralBonus)
  }

  async sellPrice () {
    return await this.instance.sellPrice.call()
  }

  async buyPrice () {
    return await this.instance.buyPrice.call()
  }

  async calculateTokensReceived (eth) {
    return await this.instance.calculateTokensReceived.call(toBasicUnit(eth).toString())
  }

  async calculateEthereumReceived (tokens) {
    return await this.instance.calculateEthereumReceived.call(toBasicUnit(tokens).toString())
  }

  async buy (eth) {
    notifyPendingTx()
    await this.instance.send(toBasicUnit(eth).toString(), {from: Utils.defaultAccount()})
    notify('[Buy Order Fulfilled]')
  }

  async buyWithReferral (eth, referredBy) {
    notifyPendingTx()
    await this.instance.buy(referredBy, {value: toBasicUnit(eth).toString()})
    notify('[Buy Order Fulfilled]')
  }

  async sell (tokens) {
    notifyPendingTx()
    await this.instance.sell(toBasicUnit(tokens).toString())
    notify('[Sell Order Fulfilled]')
  }

  async reinvest () {
    notifyPendingTx()
    await this.instance.reinvest()
    notify('[Reinvest Completed]')
  }

  async withdraw () {
    notifyPendingTx()
    await this.instance.withdraw()
    notify('[Withdraw Completed]')
  }
}

export default new Hodl3dService()
