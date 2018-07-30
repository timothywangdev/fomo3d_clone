import fomo from '../../utils/fomo.js'
import {BigNumber} from 'bignumber.js'
import Utils from '../../utils/utils.js'
var moment = require('moment')

function humanUnit(big, fixed = 4, decimals = 18) {
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
  playerData[4] = playerData[4].mul(exchangeRate)
  playerData[5] = playerData[5].mul(exchangeRate)

  let rv = {
    keys: humanUnit(playerData[1]),
    win: humanUnit(playerData[2]),
    gen: humanUnit(playerData[3]),
    aff: humanUnit(playerData[4]),
    eth: humanUnit(playerData[5])
  }

  return rv
}

async function _getData () {
  let web3 = Utils.getWeb3()
  let accounts = web3.eth.accounts
  let exchangeRate = await fomo.exchangeRate()
  let timeLeftData = await fomo.getTimeLeft()

  let roundData = await fomo.getCurrentRoundInfo()

  let playerData = await fomo.getPlayerInfoByAddress(accounts[0])

  return {
    roundInfo: roundInfo(roundData, timeLeftData, exchangeRate),
    playerInfo: playerInfo(playerData, exchangeRate)
  }
}

const getData = () => {
  return {
    type: 'FOMO_GET_DATA',
    payload: _getData()
  }
}

export { getData }
