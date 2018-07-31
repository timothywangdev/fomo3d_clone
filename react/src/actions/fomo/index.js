import fomo from '../../utils/fomo.js'
import {BigNumber} from 'bignumber.js'
import Utils from '../../utils/utils.js'
var moment = require('moment')

function humanUnit (big, fixed = 4, decimals = 18) {
  if (!big) return '0.0000'
  let base = new BigNumber(10).pow(new BigNumber(decimals))
  big = big.div(base)
  return big.toFixed(fixed)
}

function roundInfo (roundData, timeLeftData, exchangeRate) {
  roundData[0] = roundData[0].mul(exchangeRate)
  roundData[5] = roundData[5].mul(exchangeRate)

  let rv = {
    eth: humanUnit(roundData[0]),
    rID: roundData[1].toString(),
    keys: humanUnit(roundData[2]),
    end: roundData[3].toNumber(),
    start: roundData[4].toNumber(),
    pot: humanUnit(roundData[5]),
    team: roundData[6].toNumber(),
    plyr: roundData[7],
    timeLeft: timeLeftData[0].toNumber(),
    started: timeLeftData[1]
  }

  return rv
}

function playerInfo (playerData, exchangeRate) {
  playerData[2] = playerData[2].mul(exchangeRate)
  playerData[3] = playerData[3].mul(exchangeRate)

  let rv = {
    keys: humanUnit(playerData[1]),
    earnings: humanUnit(playerData[2]),
    eth: humanUnit(playerData[3])
  }

  return rv
}

function vaultsInfo (vaultsData, exchangeRate) {
  vaultsData[0] = vaultsData[0].mul(exchangeRate)
  vaultsData[1] = vaultsData[1].mul(exchangeRate)
  vaultsData[2] = vaultsData[2].mul(exchangeRate)

  return {
    win: humanUnit(vaultsData[0]),
    gen: humanUnit(vaultsData[1]),
    aff: humanUnit(vaultsData[2]),
    total: humanUnit(vaultsData[0].add(vaultsData[1]).add(vaultsData[2]))
  }
}

async function _getData () {
  let web3 = Utils.getWeb3()
  let accounts = web3.eth.accounts
  let exchangeRate = await fomo.exchangeRate()
  let timeLeftData = await fomo.getTimeLeft()

  let roundData = await fomo.getCurrentRoundInfo()

  let playerData = await fomo.getPlayerInfoByAddress(accounts[0])
  let vaultsData = await fomo.getPlayerVaults(accounts[0])

  let allowance = await fomo.getTokenAllowance(accounts[0])

  return {
    roundInfo: roundInfo(roundData, timeLeftData, exchangeRate),
    playerInfo: playerInfo(playerData, exchangeRate),
    vaultsInfo: vaultsInfo(vaultsData, exchangeRate),
    tokenInfo: {
      allowance: humanUnit(allowance)
    }
  }
}

const getData = () => {
  return {
    type: 'FOMO_GET_DATA',
    payload: _getData()
  }
}

export { getData }
