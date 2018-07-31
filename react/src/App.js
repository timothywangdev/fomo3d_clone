import React, { Component } from 'react'
import logo from './logo.svg'
import './App.css'
import { Grid, Input, Message, Container, Header, Divider, Button, Segment, Step, Icon, Statistic, Form, Image, Menu, Label, List} from 'semantic-ui-react'
import { connect } from 'react-redux'
import { getData, getBuyPrice, buy } from './actions/fomo'
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

    this.state = { activeItem: 'purchase' }
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

  buyOnSubmit = () => {
    let master = this.state.master
    if (!this.props.fataError)
      if (this.state.buyAmount && this.state.buyAmount != '') {
        this.props.buy(master, this.state.buyAmount)
      } else {
        this.props.buy(master, '1')
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

  render () {
    if (!this.props || !this.props.roundInfo) {
      return (
        <div> Loading ... </div>
      )
    }


    const { activeItem } = this.state

    const { roundInfo, playerInfo, vaultsInfo, tokenInfo, buyPrice, buyTotalPrice } = this.props

    return (
      <div className='fomo' style={{marginTop: '10%'}}>
        <ToastContainer />
        {/*
            Heads up! The styles below are necessary for the correct render of this example.
            You can do same with CSS, the main idea is that all the elements up to the `Grid`
            below must have a height of 100%.
          */}
        <style>{`
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
                        action={{ color: 'grey', labelPosition: 'left', icon: 'clipboard check', content: 'Approve' }}
                        actionPosition='left'
                        label={{ basic: true, content: 'XYZ', color: 'white' }}
                        labelPosition='right'
                        placeholder='Search...'
                        defaultValue='10'
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
                      <Button > <Icon name='dollar sign' /> Use Vault </Button>
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
                      <Button fluid inverted color='green'>
                        Withdraw
                      </Button>
                    </div>
                  </Segment>
                }
              </div>
            </Grid.Row>
          </Grid.Column>
        </Grid>
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
    buy: (affCode, keys) =>  { dispatch(buy(affCode, keys)) }
  })
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App)
