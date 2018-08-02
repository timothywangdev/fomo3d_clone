import fomo from '../../utils/fomo.js'
import Utils from '../../utils/utils.js'
import {BigNumber} from 'bignumber.js'

function roundInfo (roundData, timeLeftData, exchangeRate, decimals) {
  roundData[0] = roundData[0].mul(exchangeRate)
  roundData[5] = roundData[5].mul(exchangeRate)

  let rv = {
    eth: Utils.humanUnit(roundData[0], 4, decimals),
    rID: roundData[1].toString(),
    keys: Utils.humanUnit(roundData[2]),
    end: roundData[3].toNumber(),
    start: roundData[4].toNumber(),
    pot: Utils.humanUnit(roundData[5], 4, decimals),
    team: roundData[6].toNumber(),
    plyr: roundData[7],
    timeLeft: timeLeftData[0].toNumber(),
    started: timeLeftData[1]
  }

  return rv
}

function playerInfo (playerData, exchangeRate, decimals) {
  playerData[2] = playerData[2].mul(exchangeRate)
  playerData[3] = playerData[3].mul(exchangeRate)

  let rv = {
    keys: Utils.humanUnit(playerData[1]),
    earnings: Utils.humanUnit(playerData[2], 4, decimals),
    eth: Utils.humanUnit(playerData[3], 4, decimals)
  }

  return rv
}

function vaultsInfo (vaultsData, exchangeRate, decimals) {
  vaultsData[0] = vaultsData[0].mul(exchangeRate)
  vaultsData[1] = vaultsData[1].mul(exchangeRate)
  vaultsData[2] = vaultsData[2].mul(exchangeRate)

  return {
    win: Utils.humanUnit(vaultsData[0], 4, decimals),
    gen: Utils.humanUnit(vaultsData[1], 4, decimals),
    aff: Utils.humanUnit(vaultsData[2], 4, decimals),
    total: Utils.humanUnit(vaultsData[0].add(vaultsData[1]).add(vaultsData[2]), 4, decimals)
  }
}

async function _getData () {
  let web3 = Utils.getWeb3()
  let accounts = web3.eth.accounts
  let exchangeRate = fomo.exchangeRate
  let timeLeftData = await fomo.getTimeLeft()

  let roundData = await fomo.getCurrentRoundInfo()

  let playerData = await fomo.getPlayerInfoByAddress(accounts[0])
  let vaultsData = await fomo.getPlayerVaults(accounts[0])

  let allowance = await fomo.getTokenAllowance(accounts[0])

  let buyPrice = await fomo.iWantXKeys(Utils.getBase(18))
  buyPrice = buyPrice.mul(exchangeRate)

  let tokenBalance = await fomo.getTokenBalance(accounts[0])

  let decimals = fomo.tokenDecimals

  return {
    roundInfo: roundInfo(roundData, timeLeftData, exchangeRate, decimals),
    playerInfo: playerInfo(playerData, exchangeRate, decimals),
    vaultsInfo: vaultsInfo(vaultsData, exchangeRate, decimals),
    tokenInfo: {
      allowance: Utils.humanUnit(allowance, 4, decimals),
      balance: Utils.humanUnit(tokenBalance, 4, decimals)
    },
    buyPrice: Utils.humanUnit(buyPrice, 6, decimals)
  }
}

async function _getBuyPrice (keys) {
  let decimals = fomo.tokenDecimals
  let exchangeRate = fomo.exchangeRate

  let base = Utils.getBase(18)
  let _keys = base.times(new BigNumber(keys))
  let buyPrice = await fomo.iWantXKeys(_keys)
  buyPrice = buyPrice.mul(exchangeRate)
  return {
    buyTotalPrice: Utils.humanUnit(buyPrice, 6, decimals)
  }
}

async function _buy (affCode, keys) {
  let decimals = fomo.tokenDecimals
  let exchangeRate = fomo.exchangeRate

  let base = Utils.getBase(18)
  let _keys = base.times(new BigNumber(keys))
  let buyPrice = await fomo.iWantXKeys(_keys)
  buyPrice = buyPrice.mul(exchangeRate)

  if (!affCode) {
    affCode = '0x0000000000000000000000000000000000000000'
  }
  await fomo.buy(affCode, 0, buyPrice)
}

async function _reload (affCode, keys) {
  let decimals = fomo.tokenDecimals
  let exchangeRate = fomo.exchangeRate

  let base = Utils.getBase(18)
  let _keys = base.times(new BigNumber(keys))
  let buyPrice = await fomo.iWantXKeys(_keys)
  buyPrice = buyPrice.mul(exchangeRate)

  if (!affCode) {
    affCode = '0x0000000000000000000000000000000000000000'
  }
  await fomo.reload(affCode, 0, buyPrice)
}

async function _approve (val) {
  let decimals = fomo.tokenDecimals
  let base = Utils.getBase(decimals)
  let tokens = base.times(new BigNumber(val))

  await fomo.approveToken(tokens)
}

async function _withdraw () {
  await fomo.withdraw()
}

const getData = () => {
  return {
    type: 'FOMO_GET_DATA',
    payload: _getData()
  }
}

const getBuyPrice = (keys) => {
  return {
    type: 'FOMO_GET_BUY_PRICE',
    payload: _getBuyPrice(keys)
  }
}

const buy = (affcode, keys) => {
  return {
    type: 'FOMO_BUY',
    payload: _buy(affcode, keys)
  }
}

const reload = (affcode, keys) => {
  return {
    type: 'FOMO_RELOAD',
    payload: _reload(affcode, keys)
  }
}

const approve = (val) => {
  return {
    type: 'FOMO_APPROVE',
    payload: _approve(val)
  }
}

const withdraw = () => {
  return {
    type: 'FOMO_WITHDRAW',
    payload: _withdraw()
  }
}

export { getData, getBuyPrice, buy, approve, reload, withdraw }
