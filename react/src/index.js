import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import registerServiceWorker from './registerServiceWorker'
import 'semantic-ui-css/semantic.min.css'
import rootReducer from './reducers'
import { createStore, applyMiddleware} from 'redux'
import { Provider } from 'react-redux'
import logger from 'redux-logger'
import thunk from 'redux-thunk'
import promiseMiddleware from 'redux-promise-middleware'
import hodl3d from './utils/hodl3d.js'
import fomo from './utils/fomo.js'
import Utils from './utils/utils.js'
import Eth from 'ethjs'
import { toast } from 'react-toastify'
import { BrowserRouter, Route } from 'react-router-dom'

const initialState = {
  service: {
    loading: true,
    buyPrice: 0,
    sellPrice: 0,
    networkETH: 0,
    networkTokens: 0,
    walletTokens: 0,
    walletDividends: 0,
    tokensToReceive: 0,
    ethToReceive: 0
  }
}

const store = createStore(rootReducer, initialState, applyMiddleware(promiseMiddleware(), thunk, logger))

async function init () {
  try {
    await Utils.init()
    await fomo.init()
    var account = (await ((new Eth(Utils.getProvider())).accounts()))[0]

    setInterval(() => {
      let web3 = Utils.getWeb3()
      web3.eth.getAccounts((err, accounts) => {
        if (err) {
          console.log(err)
          return
        }
        if (account !== accounts[0]) {
          console.log(account, accounts[0])
          web3.eth.defaultAccount = accounts[0]
          account = accounts[0]
          Utils.account = accounts[0]
          window.location.reload()
        }
      })
    }, 1000)

    ReactDOM.render(
      <Provider store={store}>
        <BrowserRouter>
          <div>
            <Route exact path='/' component={App} />
            <Route path='/master/:address' component={App} />
          </div>
        </BrowserRouter>
      </Provider>,
      document.getElementById('root'))
    registerServiceWorker()
  } catch (error) {
    ReactDOM.render(
      <Provider store={store}>
        <App fataError={error} />
      </Provider>,
      document.getElementById('root'))
    console.log(error)
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.web3) {
    init()
  } else {
    // wait for metamask web3 to be injected
    setTimeout(() => {
      init()
    }, 1e3)
  }
}, false
)
