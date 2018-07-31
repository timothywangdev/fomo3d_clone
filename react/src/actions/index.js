import Hodl3dService from '../utils/hodl3d.js'
import {BigNumber} from 'bignumber.js'
import Utils from '../utils/utils.js'

function humanUnit (big, fixed = 4) {
  if (!big) return '0.0000'
  let base = new BigNumber(10).pow(new BigNumber(18))
  big = big.div(base)
  return big.toFixed(fixed)
}

async function _getData () {
  let web3 = Utils.getWeb3()
  let accounts = web3.eth.accounts
  let networkTokens = await Hodl3dService.tokenSupply()
  let networkETH = await Hodl3dService.totalEthereumBalance()
  let buyPrice = await Hodl3dService.buyPrice()
  let sellPrice = await Hodl3dService.sellPrice()
  let walletTokens = await Hodl3dService.balanceOf(accounts[0])
  let walletDividends = await Hodl3dService.myDividends(true)
  let ethBalance = await Utils.getBalance()
  let walletReferralBonus = await Hodl3dService.myDividends(false)
  walletReferralBonus = walletDividends.sub(walletReferralBonus)
  ethBalance = new BigNumber(ethBalance.toString())

  return {
    buyPrice: humanUnit(buyPrice, 8),
    sellPrice: humanUnit(sellPrice, 8),
    networkETH: humanUnit(networkETH),
    networkTokens: humanUnit(networkTokens),
    walletTokens: humanUnit(walletTokens),
    walletDividends: humanUnit(walletDividends),
    ethBalance: humanUnit(ethBalance, 8),
    walletReferralBonus: humanUnit(walletReferralBonus)
  }
}

async function _buy (eth, master) {
  if (master) {
    await Hodl3dService.buyWithReferral(eth, master)
  } else {
    await Hodl3dService.buy(eth)
  }
}

async function _sell (tokens) {
  await Hodl3dService.sell(tokens)
}

async function _calculateTokensReceived (eth) {
  let rv = await Hodl3dService.calculateTokensReceived(eth)
  return humanUnit(rv, 8)
}

async function _calculateEthereumReceived (tokens) {
  let rv = await Hodl3dService.calculateEthereumReceived(tokens)
  return humanUnit(rv, 8)
}

async function _reinvest () {
  await Hodl3dService.reinvest()
}

async function _withdraw () {
  await Hodl3dService.withdraw()
}

const getData = () => {
  return {
    type: 'GET_DATA',
    payload: _getData()
  }
}

const buy = (eth, master) => {
  return {
    type: 'BUY',
    payload: _buy(eth, master)
  }
}

const sell = (tokens) => {
  return {
    type: 'SELL',
    payload: _sell(tokens)
  }
}

const calculateTokensReceived = (eth) => {
  return {
    type: 'TOKENS_TO_RECEIVE',
    payload: _calculateTokensReceived(eth)
  }
}

const calculateEthereumReceived = (tokens) => {
  return {
    type: 'ETH_TO_RECEIVE',
    payload: _calculateEthereumReceived(tokens)
  }
}

const reinvest = () => {
  return {
    type: 'REINVEST',
    payload: _reinvest()
  }
}

const withdraw = () => {
  return {
    type: 'WITHDRAW',
    payload: _withdraw()
  }
}

export { getData, buy, sell, calculateTokensReceived, calculateEthereumReceived, reinvest, withdraw}
