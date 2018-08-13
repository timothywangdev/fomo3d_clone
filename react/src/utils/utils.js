import contract from 'truffle-contract'
import Eth from 'ethjs'
import {BigNumber} from 'bignumber.js'
var Web3 = require('web3')
const {promisify} = require('util')

var createErrorHandler = function (name) {
  return function (err) {
    console.error(err)
    throw new Error('Contract ' + name + ' is not found, make sure you are connected to Rinkeby Testnet')
  }
}

export default class Utils {

  static addr2Token = {
    '0x9561c133dd8580860b6b7e504bc5aa500f0f06a7': 1,
    '0x1234556': 1,
  }

  static name2Token = {
    'XYZ' : 0,
    'BAT' : 1
  }
  
  static tokenList = [
    {
      name: 'XYZ',
      address: '0x9561c133dd8580860b6b7e504bc5aa500f0f06a7',
      decimals: 18
    },
    {
      name: 'BAT',
      address: '0x9561c133dd8580860b6b7e504bc5aa500f0f06a7',
      decimals: 18
    }
  ]

  static async init () {
    this.eth = new Eth(this.getProvider())
    const accounts = await this.eth.accounts()
    this.account = accounts[0]
    let web3 = this.getWeb3()
  }

  static async getBlockNumber() {
    return new Promise(function(resolve,reject){
      this.web3.eth.blockNumber = resolve
    });
  }

  static defaultAccount () {
    return this.account
  }

  static getWeb3 () {
    if (this.web3) return this.web3
    this.web3 = new Web3(this.getProvider())
    this.web3.eth.defaultAccount = this.account
    return this.web3
  }

  static async getBalance () {
    return await this.eth.getBalance(this.account)
  }

  static getProvider () {
    if (typeof window.web3 !== 'undefined' && typeof window.web3.currentProvider !== 'undefined') {
      return window.web3.currentProvider
    } else {
      throw new Error('Web3 is not found, please use either metamask or DApp Browser')
    }
  }

  static async getAbi (contract) {
    const storageKey = `hodl3d:abi:${contract}`
    const cached = window.sessionStorage.getItem(storageKey)

    try {
      if (cached) {
        return JSON.parse(cached)
      }
    } catch (error) {
      console.error(error)
    }

    const url = '/contracts'
    const data = await window.fetch(`${url}/${contract}.json`)
    const json = await data.json()

    /*
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(json))
    } catch (error) {
      console.error(error)
    }
    */

    return json
  }

  static async getHodl3D () {
    const hodl3DArtifact = await this.getAbi('Hodl3D')
    const Hodl3D = contract(hodl3DArtifact)
    Hodl3D.setProvider(this.getProvider())
    Hodl3D.defaults({from: this.defaultAccount()})
    return Hodl3D.deployed().catch(createErrorHandler('Hodl3D'))
  }

  static async getFomo () {
    let _artifact = await this.getAbi('FoMo3Dlong')
    let _c = contract(_artifact)
    _c.setProvider(this.getProvider())
    _c.defaults({from: this.defaultAccount()})
    return _c.deployed().catch(createErrorHandler('FoMo3Dlong'))
  }

  static async getToken (addr) {
    let _artifact = await this.getAbi('Token')
    let _c = contract(_artifact)
    _c.setProvider(this.getProvider())
    _c.defaults({from: this.defaultAccount()})
    if (addr) {
      return _c.at(addr)
    } else {
      let tokenInstance = await _c.deployed().catch(createErrorHandler('Token'))
      // test only
      this.tokenList[0].address = tokenInstance.address

      this.addr2Token[tokenInstance.address] = 0

      return tokenInstance
    }
  }

  static getTokenDecimals (addr) {
    return this.tokenList[this.addr2Token[addr]].decimals
  }

  static humanUnit (big, fixed = 4, decimals = 18) {
    if (!big) return '0.0000'
    let base = new BigNumber(10).pow(new BigNumber(decimals))
    big = big.div(base)
    return big.toFixed(fixed)
  }

  static basicUnit (val, decimals = 18) {
    let base = new BigNumber(10).pow(new BigNumber(decimals))
    if (val) {
      return (new BigNumber(val)).times(base)
    }
  }

  static getBase (exp) {
    return new BigNumber(10).pow(new BigNumber(exp))
  }
}
