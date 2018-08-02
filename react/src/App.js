import React, { Component } from 'react'
import logo from './logo.svg'
import './App.css'
import { Modal, Grid, Input, Message, Container, Header, Divider, Button, Segment, Step, Icon, Statistic, Form, Image, Menu, Label, List} from 'semantic-ui-react'
import { connect } from 'react-redux'
import { getData, getBuyPrice, buy, approve, reload, withdraw } from './actions/fomo'
import Utils from './utils/utils.js'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Cookies from 'js-cookie'
import Countdown from './components/countdown'

const square = { width: 400, height: 400, filter: 'drop-shadow(0 0 2px #9BC01C) drop-shadow(0 0 25px #F7F7D2) drop-shadow(0 0 5px #F7F7D2)', opacity: 0.8, animation: 'pulsate 2s ease-out infinite'}
const segment = {
  backgroundColor: 'rgb(45, 50, 56)',
  borderTop: '1px solid rgb(29, 32, 36)',
  borderBottom: '1px solid rgb(103, 107, 112)'
}

class App extends Component {
  constructor () {
    super()
    this.state = {
      activeItem: 'purchase',
      activeMenuItem: '',
      tutorialModelOpen: false
    }
  }

  componentDidMount () {
    let address = this.props.match ? this.props.match.params.address : null
    if (address) {
      Cookies.set('master', address, { expires: 365 })
    } else {
      this.setState({master: Cookies.get('master')})
    }

    if (this.props.fataError) {
      toast.error(this.props.fataError.message, {
        position: toast.POSITION.TOP_CENTER,
        autoClose: false
      })
    } else {
      this.props.getData()
      setInterval(this.props.getData, 20000)

    }
  }

  handleItemClick = (e, { name }) => this.setState({ activeItem: name })

  handleMenuItemClick = (e, {name}) => {
    this.setState({ tutorialModelOpen: true})
  }

  buyOnSubmit = () => {
    let master = this.state.master
    if (!this.props.fataError) {
      if (this.state.buyAmount && this.state.buyAmount != '') {
        this.props.buy(master, this.state.buyAmount)
      } else {
        this.props.buy(master, '1')
      }
      toast.info('Purchase request submitted! Check your transaction status in MetaMask.', {
        position: toast.POSITION.TOP_CENTER,
        autoClose: 12000
      })
    }
  }

  withdrawOnSubmit = () => {
    this.props.withdraw()
    toast.info('Withdraw request submitted! Check your transaction status in MetaMask.', {
      position: toast.POSITION.TOP_CENTER,
      autoClose: 12000
    })
  }

  reloadOnSubmit = () => {
    let master = this.state.master
    if (!this.props.fataError) {
      if (this.state.buyAmount && this.state.buyAmount != '') {
        this.props.reload(master, this.state.buyAmount)
      } else {
        this.props.reload(master, '1')
      }
      toast.info('Reinvest request submitted! Check your transaction status in MetaMask.', {
        position: toast.POSITION.TOP_CENTER,
        autoClose: 12000
      })
    }
  }

  onApproveSubmit = () => {
    let { approveAmount } = this.state
    if (approveAmount) {
      this.props.approve(approveAmount)
      toast.info('Approval request submitted! Check your transaction status in MetaMask.', {
        position: toast.POSITION.TOP_CENTER,
        autoClose: 12000
      })
    }
  }

  buyAmountOnChange = (event, data) => {
    this.setState({buyAmount: data.value})
    if (!this.props.fataError) {
      if (data.value !== '') {
        this.props.getBuyPrice(data.value)
      } else {
        this.props.getBuyPrice('1')
      }
    }
  }

  approveAmountOnChange = (event, data) => {
    this.setState({approveAmount: data.value})
  }

  render () {
    if (!this.props || !this.props.roundInfo) {
      return (
        <div> Loading ... </div>
      )
    }


    const { activeItem, activeMenuItem, tutorialModelOpen } = this.state

    const { roundInfo, playerInfo, vaultsInfo, tokenInfo, buyPrice, buyTotalPrice } = this.props

    return (
      <div className='fomo'>
      <Menu>
      <Menu.Item header> Fomo ERC20 </Menu.Item>
      <Menu.Item
      name='tutorial'
      active={activeMenuItem === 'tutorial'}
      onClick={this.handleMenuItemClick}
      >
      Tutorial
      </Menu.Item>
      </Menu>
      <ToastContainer />
      <style> {`
      body > div,
      body > div > div,
      body > div > div > div.fomo {
        height: 100%;
      }

      body {
        background-image: url(../background.jpg);
        background-position: center center;
        background-repeat:  no-repeat;
        background-attachment: fixed;
        background-size:  cover;
      }

@-webkit-keyframes pulsate {
    0%   { box-shadow: 0 0 0 white; }
    50%  { box-shadow: 0 0 30px white; }
    100% { box-shadow: 0 0 0 white; }
}
      `}
      </style>
      <Grid textAlign='center' style={{ height: '100%' }}>
      <Grid.Column style={{ maxWidth: 450 }}>
      <Grid.Row>
      <Segment circular style={square}>
      <Header>
      <h1 style={{
                    fontSize: '2.5rem',
                    textShadow: '0 0 5px #2b002b, 0 0 20px #cc9600, 0 0 10px #ff9900',
                    color: 'white'
                  }}>
                    Fomo ERC20
                  </h1>
                  { roundInfo.started &&
                    <h1 style={{
                      fontSize: '2.5rem',
                      textShadow: '0 0 5px #2b002b, 0 0 20px #cc9600, 0 0 10px #ff9900',
                      color: 'white'
                    }}>
                      { roundInfo.pot } XYZ
                    </h1>
                  }

                  { !roundInfo.started &&
                    <h1 style={{
                      fontSize: '2.5rem',
                      textShadow: '0 0 5px #2b002b, 0 0 20px #cc9600, 0 0 10px #ff9900',
                      color: 'white'
                    }}>
                      Start In
                    </h1>
                  }

                  <Header.Subheader>
                    <Countdown date={Date.now() + roundInfo.timeLeft * 1000} />
                  </Header.Subheader>
                </Header>
              </Segment>
            </Grid.Row>
            <Grid.Row>
              <div style={{backgroundColor: '#343a40', marginTop: '10%'}}>
                <Menu inverted pointing secondary>
                  <Menu.Item
                    name='purchase'
                    active={activeItem === 'purchase'}
                    onClick={this.handleItemClick} />
                  <Menu.Item
                    name='round'
                    active={activeItem === 'round'}
                    onClick={this.handleItemClick}
                  />
                  <Menu.Item
                    name='vault'
                    active={activeItem === 'vault'}
                    onClick={this.handleItemClick}
      />
      <Menu.Item
      name='affiliation'
      active={activeItem === 'affiliation'}
      onClick={this.handleItemClick}
      />
      </Menu>
      { activeItem === 'purchase' &&
        <Segment inverted style={{backgroundColor: '#343a40', topMargin: '0px', paddingTop: '0px'}}>
          <Segment clearing style={{backgroundColor: '#2d3238'}} >
            <Header inverted as='h5' floated='left'>
              Token Balance
            </Header>
            <Header inverted as='h5' floated='right' style={{
              textShadow: '0 0 5px #2b002b, 0 0 20px #cc9600, 0 0 10px #ff9900',
              color: 'white'}}>
              { tokenInfo.balance  } XYZ
            </Header>
          </Segment>
          <Segment clearing style={{backgroundColor: '#2d3238'}} >
            <Header inverted as='h5' floated='left'>
              Tokens Approved for Transfer
            </Header>
            <Header inverted as='h5' floated='right' style={{
              textShadow: '0 0 5px #2b002b, 0 0 20px #cc9600, 0 0 10px #ff9900',
              color: 'white'}}>
              { tokenInfo.allowance  } XYZ
            </Header>
            <Input
              action={ <Button
                         color='grey'
                                labelPosition='left'
                                icon='clipboard check'
                                content='Approve'
                         onClick={ this.onApproveSubmit }
              />}
              actionPosition='left'
              label={{ basic: true, content: 'XYZ' }}
              labelPosition='right'
              placeholder='10'
              onChange={this.approveAmountOnChange}
            />
          </Segment>
          <Input
            fluid
            labelPosition='right'
            placeholder='1'
            defaultValue='1'
            onChange={this.buyAmountOnChange} >
            <Label basic> <Icon name='key' /> </Label>
            <input />
            <Label>@ { buyTotalPrice ? buyTotalPrice : buyPrice } XYZ</Label>
          </Input>
          <Button.Group fluid style={{paddingTop: '2%'}}>
            <Button
              positive
              onClick={this.buyOnSubmit}
            >
              <Icon name='ethereum' />Send XYZ
            </Button>
            <Button.Or />
            <Button onClick={this.reloadOnSubmit} > <Icon name='dollar sign' /> Use Vault </Button>
          </Button.Group>
        </Segment>
      }
      { activeItem === 'round' &&
        <Segment inverted style={{backgroundColor: '#343a40', topMargin: '0px', paddingTop: '0px'}}>
          <div>
            <Segment clearing style={{backgroundColor: '#2d3238'}} >
              <Header inverted as='h5' floated='left'>
                Your Keys
              </Header>
              <Header inverted as='h5' floated='right' style={{
                textShadow: '0 0 5px #2b002b, 0 0 20px #cc9600, 0 0 10px #ff9900',
                color: 'white'}}>
                { playerInfo.keys } <Icon name='key' />
              </Header>
            </Segment>
            <Segment clearing style={{backgroundColor: '#2d3238'}} >
              <Header inverted as='h5' floated='left'>
                Your Earnings 
              </Header>
              <Header inverted as='h5' floated='right' style={{
                textShadow: '0 0 5px #2b002b, 0 0 20px #cc9600, 0 0 10px #ff9900',
                color: 'white'}}>
                { playerInfo.earnings } XYZ
              </Header>
            </Segment>
            <Divider horizontal inverted>
              Round Stats
            </Divider>
            <Segment clearing style={{backgroundColor: '#2d3238'}} >
              <Header inverted as='h5' floated='left'>
                Total Keys
              </Header>
              <Header inverted as='h5' floated='right'>
                { roundInfo.keys}
              </Header>
            </Segment>
            <Segment clearing style={{backgroundColor: '#2d3238'}} >
              <Header inverted as='h5' floated='left'>
                Total XYZ purchased
              </Header>
              <Header inverted as='h5' floated='right'>
                { roundInfo.eth }
              </Header>
            </Segment>
          </div>
        </Segment>
      }
                { activeItem === 'vault' &&
                  <Segment inverted style={{backgroundColor: '#343a40', topMargin: '0px', paddingTop: '0px'}}>
                    <div>
                      <Segment clearing style={{backgroundColor: '#2d3238'}} >
                        <Header inverted as='h5' floated='left'>
                          Won
                        </Header>
                        <Header inverted as='h5' floated='right'>
                          { vaultsInfo.win } XYZ
                        </Header>
                      </Segment>
                      <Segment clearing style={{backgroundColor: '#2d3238'}} >
                        <Header inverted as='h5' floated='left'>
                          Dividends
                        </Header>
                        <Header inverted as='h5' floated='right'>
                          { vaultsInfo.gen } XYZ
                        </Header>
                      </Segment>
                      <Segment clearing style={{backgroundColor: '#2d3238'}} >
                        <Header inverted as='h5' floated='left'>
                          Affiliation 
                        </Header>
                        <Header inverted as='h5' floated='right'>
                          { vaultsInfo.aff } XYZ
                        </Header>
                      </Segment>
                      <Divider horizontal inverted>
                        Fancy Divider
                      </Divider>
                      <Segment clearing style={{backgroundColor: '#2d3238'}} >
                        <Header inverted as='h5' floated='left'>
                          Total: 
                        </Header>
                        <Header inverted as='h5' floated='right'
                          style={{
                            textShadow: '0 0 5px #2b002b, 0 0 20px #cc9600, 0 0 10px #ff9900',
                            color: 'white'}} >
                  { vaultsInfo.total } XYZ
                </Header>
              </Segment>
              <Button
                fluid
                inverted
                color='green'
                onClick={this.withdrawOnSubmit}
              >
                Withdraw
              </Button>
        </div>
              </Segment>
                }
      {
        activeItem === 'affiliation' &&
        <Segment inverted style={{backgroundColor: '#343a40', topMargin: '0px', paddingTop: '0px'}}>
          <Segment clearing style={{backgroundColor: '#2d3238'}} >
            <Message>
              <Message.Header> Affiliation Link </Message.Header>
              <div style={{wordWrap: "break-word"}}>
                <p>
                  Whenever someone visits the site via this unique link, they have your masternode stored in our smart contract that tracks all purchases they make, now and in the future. You get 10% of their purchases as affiliation rewards.
                </p>

                <p>
                   <span style={{fontWeight: 'bold'}}> https://pumpanddump/master={Utils.account} </span>
                </p>
              </div>
            </Message>
          </Segment>
        </Segment>
      }
        </div>
            </Grid.Row>
      </Grid.Column>
      </Grid>
      <Modal open={tutorialModelOpen} basic size='small'>
        <Header icon='archive' content='Tutorial' />
        <Modal.Content>
          <p>
            Fomo ERC20 is a new and innovative online lottery game that runs on the Ethereum blockchain.

            Fomo ERC20 guarantees a passive income as long as you hold keys and while the game is in progress. (Keys are like lottery tickets). The more keys you hold, the more you earn.

            When the game ends, one lucky winner (the person who buys the last key), gets 48% of the Active Pot!

            Then a new game (lottery) begins!

            Fomo ERC20 is easy to play. You can be earning a passive income in less than 30 minutes!
          </p>
        </Modal.Content>
        <Modal.Actions>
          <Button
            color='red'
            inverted
            onClick={()=>{this.setState({tutorialModelOpen: false})}}
          >
            <Icon name='close' /> Close
          </Button>
        </Modal.Actions>
      </Modal>
        </div>)
  }
}

const mapStateToProps = state => {
  return {
    roundInfo: state.fomoReducer.roundInfo,
    playerInfo: state.fomoReducer.playerInfo,
    vaultsInfo: state.fomoReducer.vaultsInfo,
    tokenInfo: state.fomoReducer.tokenInfo,
    buyPrice: state.fomoReducer.buyPrice,
    buyTotalPrice: state.fomoReducer.buyTotalPrice
  }
}

function mapDispatchToProps (dispatch) {
  return ({
    getData: () => { dispatch(getData()) },
    getBuyPrice: (keys) => { dispatch(getBuyPrice(keys)) },
    buy: (affCode, keys) =>  { dispatch(buy(affCode, keys)) },
    approve: (val) => { dispatch(approve(val)) },
    reload: (affCode, keys) => { dispatch(reload(affCode, keys)) },
    withdraw: () => { dispatch(withdraw()) },
  })
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App)
