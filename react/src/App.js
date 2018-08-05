import React, { Component } from 'react'
import logo from './logo.svg'
import './App.css'
import { Modal, Grid, Input, Message, Container, Header, Divider, Button, Segment, Step, Icon, Statistic, Form, Image, Menu, Label, List, Dimmer, Loader } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { getData, getBuyPrice, buy, approve, reload, withdraw } from './actions/fomo'
import Utils from './utils/utils.js'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Cookies from 'js-cookie'
import Countdown from './components/countdown'
var moment = require('moment')

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
      tutorialModelOpen: false,
      setupStart: false,
      AnnouncementModelOpen: true
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
      setInterval(this.props.getData, 5000)

    }
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    let { roundInfo } = this.props
    if (roundInfo) {
      if (!roundInfo.started && !this.state.setupStart) {
        this.setState({setupStart: true})
        let _now = moment().unix()
        let diff = roundInfo.deadline - _now
        setTimeout(window.location.reload.bind(window.location), diff*1000)
      }
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
    }
  }

  withdrawOnSubmit = () => {
    this.props.withdraw()
  }

  reloadOnSubmit = () => {
    let master = this.state.master
    if (!this.props.fataError) {
      if (this.state.buyAmount && this.state.buyAmount != '') {
        this.props.reload(master, this.state.buyAmount)
      } else {
        this.props.reload(master, '1')
      }
    }
  }

  onApproveSubmit = () => {
    let { approveAmount } = this.state
    if (approveAmount) {
      this.props.approve(approveAmount)
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

  formatAddr (addr) {
    return addr.slice(0, 8) + '...' + addr.slice(-6)
  }

  render () {
    if (!this.props || !this.props.roundInfo) {
      return (
        <div>
          <Segment>
            <Dimmer active page>
              <Loader indeterminate> Loading data from Mainnet </Loader>
            </Dimmer>
          </Segment>
        </div>
      )
    }


    const { activeItem, activeMenuItem, tutorialModelOpen, AnnouncementModelOpen } = this.state

    const { roundInfo, playerInfo, vaultsInfo, tokenInfo, buyPrice, buyTotalPrice } = this.props

    return (
      <div className='fomo'>
        <Menu inverted style={{backgroundColor: 'rgba(52, 58, 64, 0.4)', marginBottom: '5%'}} >
          <Menu.Item>
            <img src='./rocket.png' />
          </Menu.Item>
          <Menu.Item header> Mooning </Menu.Item>
          <Menu.Item
            header
            name='readme'
            active={activeMenuItem === 'readme'}
            onClick={this.handleMenuItemClick}
          >
            ReadMe
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
                    Current Pot
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
                    <Countdown date={roundInfo.deadline * 1000} />
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
                        disabled={!roundInfo.started}
                        positive
                        onClick={this.buyOnSubmit}
                      >
                        <Icon name='ethereum' />Send XYZ
                      </Button>
                      <Button.Or />
                      <Button disabled={!roundInfo.started} onClick={this.reloadOnSubmit} > <Icon name='dollar sign' /> Use Vault </Button>
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
                          Current Lead
                        </Header>
                        <Header inverted as='h5' floated='right'>
                          { this.formatAddr(roundInfo.plyr) }
                        </Header>
                      </Segment>
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
                        <Message.Header> Two-tier affiliate system </Message.Header>
                        <div style={{wordWrap: "break-word"}}>
                          <p>
                            With a two-tier affiliate tracking system, it allows you to make commissions not only on your referrals, but your sub-affiliate referrals.
                          </p>
                          <p>
                            Say for example, Person A uses your link to visite this website. Then Person A sends Person B to the site using his/her link. You get comissions from both Person A and Person B.
                            Suppose Person A made a purchase, then you get 10% of tokens he/she added to the game. Now suppose Person B made a purchase, you and Person A both get 10% of tokens Person C added to the game.
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
        <Modal open={tutorialModelOpen} size='small'>
          <Header icon='archive' content='README' />
          <Modal.Content scrolling>
            <List as='ol'>
              <List.Item>
                <Message warning>
                  <Message.Header> Verify the Smart Contract First! </Message.Header>
                  <p> Always verify the <a href="https://etherscan.io/address/0xe4d9306c7c9a275ad286c1349c684e0f2626d0c7" target="_blank"> contract code </a> as well as the contract address before sending any transactions.  Never trust what this website tells you. </p>
                  <p> Our contract is based on the original F3D contract with several changes and simplifications. The most obvious one being
                    the support of all ERC20 tokens. </p>
                </Message>
              </List.Item>
              <List.Item>
                <Message>
                  <Message.Header> Game Rules </Message.Header>
                  <p> Each key purchased adds 30 seconds to the round timer. Each purchase can increase the timer by a maximum of 1 hour. </p>
                  <p> Keys slowly increase in price (along with how much of the final pot they're worth) as the round continues. You are guaranteed a portion of the exit-scam for every key you own, and betting on the final volume of a round can result in a tidy sum of Ethereum being deposited into your vault when someone wins. </p>
                  <p> A round is preceded with a 10 minutes starting grace period where key purchases are disabled. </p>
                  <p> The last player who has purchased at least 1 full key when the timer completes its countdown, immediately drains half of the pot and ends the round.  </p>
                </Message>
              </List.Item>
              <List.Item>
                <Message>
                  <p>  Fees Allocation: 53% distributed to the pot, 25% distributed to all key holders,
                    20% distributed to the player's two-level referrers, 2% distributed to the community fund. </p>
                </Message>
              </List.Item>
              <List.Item>
                <Message>
                  <p>
                    Pot Allocation: 50% goes to the winner, 25% distributed to all key holders, 25% goes to the next round.
                  </p>
                </Message>
              </List.Item>
            </List>
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
