var BigNumber = require('bignumber.js')

const { duration } = require('openzeppelin-solidity/test/helpers/increaseTime')

const FoMo3Dlong = artifacts.require('FoMo3Dlong')
const Token = artifacts.require('Token')
var moment = require('moment')


web3.eth.getAccountsPromise = function () {
  return new Promise(function (resolve, reject) {
    web3.eth.getAccounts(function (e, accounts) {
      if (e != null) {
        reject(e)
      } else {
        console.log('accounts:', accounts)
        resolve(accounts)
      }
    })
  })
}

function advanceBlock () {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method: 'evm_mine',
      id: Date.now(),
    }, (err, res) => {
      return err ? reject(err) : resolve(res);
    });
  });
}

function increaseTime (duration) {
  const id = Date.now()

  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: [duration],
      id: id,
    }, err1 => {
      if (err1) return reject(err1);

      web3.currentProvider.sendAsync({
        jsonrpc: '2.0',
        method: 'evm_mine',
        id: id + 1,
      }, (err2, res) => {
        return err2 ? reject(err2) : resolve(res);
      });
    });
  });
}

async function latestTime () {
  const block = await web3.eth.getBlock('latest');
  return block.timestamp;
}

var exchangeRate
var base = new BigNumber(10).pow(new BigNumber(18))

function diff(old, _new){
  return ((old-_new)/60).toString() + ' min'
}

async function roundInfo(roundData) {
  return {
    eth: roundData[0].div(base).toString(),
    rID: roundData[1].toString(),
    keys: roundData[2].div(base).toString(),
    end: diff(roundData[3].toNumber(), await latestTime()),
    start: diff(roundData[4].toNumber(), await latestTime()),
    pot: roundData[5].div(base).toString(),
    plyr: roundData[6],
  }
}

function playerInfo(playerData) {
  return {
    pID: playerData[0],
    keys: playerData[1].div(base).toString(),
    earnings: playerData[2].mul(exchangeRate).div(base).toString(),
    eth: playerData[3].mul(exchangeRate).div(base).toString()
  }
}
module.exports = async function (callback) {
  console.log(moment().toString())
  var accounts = await web3.eth.getAccountsPromise()
  var fomo = await FoMo3Dlong.deployed()
  var token = await Token.deployed()
  var token2 = await Token.new()

  // activate the game
  await fomo.activate(token.address, 1000)
  await fomo.activate(token2.address, 1000)
  console.log(token2.address)

  /*
  exchangeRate = await fomo.exchangeRate.call(token.address)
  let price = await fomo.getBuyPrice.call(token.address)
  console.log('starting price: ', price.mul(exchangeRate).div(base).toString())

  let roundData = await fomo.getCurrentRoundInfo.call(token.address)
  console.log(await roundInfo(roundData))

  
  await token.approve(fomo.address, new BigNumber(1e19))
  let allowance = await token.allowance.call(accounts[0], fomo.address)
  await fomo.buyXaddr(token.address, 0, new BigNumber(1e18))

  
  let playerData = await fomo.getPlayerInfoByAddress.call(token.address, accounts[0])
  console.log(playerInfo(playerData))


  increaseTime( duration.minutes(1))
  advanceBlock()
  
  console.log('buy event:')

  await fomo.buyXaddr(0, 0, new BigNumber(1e18))

  roundData = await fomo.getCurrentRoundInfo.call()
  console.log(await roundInfo(roundData))

  playerData = await fomo.getPlayerInfoByAddress.call(accounts[0])
  console.log(playerInfo(playerData))

  let vaults = await fomo.getPlayerVaults(accounts[0])
  console.log(vaults)

  let bal_1 = await token.balanceOf.call(accounts[0])
  await fomo.withdraw()
  let bal_2 = await token.balanceOf.call(accounts[0])
  console.log('withdraw')
  let rewards = bal_2.sub(bal_1)
  console.log(rewards.div(base).toString())

  playerData = await fomo.getPlayerInfoByAddress.call(accounts[0])
  console.log(playerInfo(playerData))
  */
}
