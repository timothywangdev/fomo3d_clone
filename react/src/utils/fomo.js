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

function notifyEventOwner(msg) {
  toast.success(msg, {
    position: toast.POSITION.TOP_CENTER
  })
}

function notifyEventOther(msg) {
  toast(msg, {
    position: toast.POSITION.BOTTOM_RIGHT
  })
}

function formatAddr (addr) {
  return addr.slice(0, 8) + '...' + addr.slice(-6)
}

class FomoService {
  constructor () {
    this.instance = null
  }

  async init () {
    this.instance = await Utils.getFomo()
    let addr = await this.instance.token.call()
    this.token = await Utils.getToken(addr)
    this.exchangeRate = await this.instance.exchangeRate.call()
    this.tokenDecimals = 18
    let events = this.instance.allEvents({fromBlock: 'latest', toBlock: 'latest'})
    var fomoWatchFunction = (function(error, event) {
      if (!error) {
        switch (event.event) {

        case 'onEndTx':
          let keys = Utils.humanUnit(event.args.keysBought)
          if (event.args.playerAddress === Utils.account) {
            // fired due to current account
            notifyEventOwner('Bought ' + keys + ' keys successfully!')
          } else {
            notifyEventOther(formatAddr(event.args.playerAddress) +
                             ' just bought ' + keys + ' keys!')
          }
          break
        case 'onWithdraw':
          if (event.args.playerID === Utils.account) {
            console.log(this)
            let ethOut = event.args.ethOut.times(this.exchangeRate)
            ethOut = Utils.humanUnit(ethOut, 4,  this.tokenDecimals)
            notifyEventOwner('Withdrew ' + ethOut + ' tokens successfully!')
          }
          break
        }
      }
    }).bind(this)
    events.watch(fomoWatchFunction)

    var tokenApprovalWatchFunction = (function(error, event) {
      if (!error) {
        let value = Utils.humanUnit(event.args.value, 4, this.tokenDecimals)
        notifyEventOwner('Total tokens approved changed to ' + value + ' !')
      }
    }).bind(this)


    let tokenApprovalEvent = this.token.Approval({owner: Utils.account, spender: this.getInstanceAddress()})
    tokenApprovalEvent.watch(tokenApprovalWatchFunction)
  }

  getInstanceAddress () {
    return this.instance.address
  }

  async getCurrentRoundInfo () {
    return this.instance.getCurrentRoundInfo()
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
    let balance = await this.getTokenBalance (Utils.account)
    let allowance = await this.getTokenAllowance(Utils.account)
    let afterIncreased = allowance.add(tokens)
    console.log(afterIncreased, balance, allowance, tokens)
    if (afterIncreased.lte(balance)) {
      // enough tokens approve more
      toast.info('Approval request submitted! Check your transaction status in MetaMask.', {
        position: toast.POSITION.TOP_CENTER,
        autoClose: 12000
      })
      return this.token.approve(this.instance.address, afterIncreased.toString())
    } else {
      // not enough tokens
      toast.error('Not enough tokens for approval.', {
        position: toast.POSITION.TOP_CENTER
      })
    }
  }

  async buy (affCode, team, tokens) {
    let allowance = await this.getTokenAllowance(Utils.account)
    if (tokens.gt(allowance)) {
      // not enough allowance
      toast.error('Not enough tokens approved for transfer', {
        position: toast.POSITION.TOP_CENTER
      })
      return
    }
    toast.info('Purchase request submitted! Check your transaction status in MetaMask.', {
      position: toast.POSITION.TOP_CENTER,
      autoClose: 12000
    })
    await this.instance.buyXaddr(affCode, tokens.toString())
  }

  async iWantXKeys (keys) {
    return this.instance.iWantXKeys.call(keys.toString())
  }

  async reload (affCode, team, tokens) {
    toast.info('Reinvest request submitted! Check your transaction status in MetaMask.', {
      position: toast.POSITION.TOP_CENTER,
      autoClose: 12000
    })
    await this.instance.reLoadXaddr(affCode, tokens.toString())
  }

  async withdraw() {
    toast.info('Withdraw request submitted! Check your transaction status in MetaMask.', {
      position: toast.POSITION.TOP_CENTER,
      autoClose: 12000
    })
    await this.instance.withdraw()
  }

  async getRndGap () {
    return this.instance.rndGap_.call()
  }
}

export default new FomoService()
