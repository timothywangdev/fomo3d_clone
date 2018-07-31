import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { Grid, Input, Message, Container, Header, Divider, Button, Segment, Step, Icon, Statistic } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { getData, buy, sell, calculateTokensReceived, calculateEthereumReceived, reinvest, withdraw } from './actions'
import Utils from './utils/utils.js'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
import Cookies from 'js-cookie'

class App extends Component {

  constructor () {
    super()
    this.state = {
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

  buyAmountOnChange = (event, data) => {
    this.setState({buyAmount: data.value})
    if (!this.props.fataError)
      this.props.calculateTokensReceived(data.value)
  }

  buyOnSubmit = () => {
    if (!this.props.fataError)
      this.props.buy(master, this.state.buyAmount)
  }

  sellAmountOnChange = (event, data) => {
    this.setState({sellAmount: data.value})
    if (!this.props.fataError)
      this.props.calculateEthereumReceived(data.value)
  }

  sellOnSubmit = () => {
    if (!this.props.fataError)
      this.props.sell(this.state.sellAmount)
  }

  reinvestOnSubmit = () => {
    if (!this.props.fataError)
      this.props.reinvest()
  }

  withdrawOnSubmit = () => {
    if (!this.props.fataError)
      this.props.withdraw()
  }

  etherscanOnSubmit = () => {
    var win = window.open('https://etherscan.io/', '_blank');
  }


  render() {
    if (!this.props) {
      return (
        <div> Loading ... </div>
      )
    }

    var { tokensToReceive, ethToReceive, buyPrice, sellPrice, networkETH, networkTokens, walletTokens, walletDividends, ethBalance, walletReferralBonus } = this.props

    var referralMessage
    if (parseFloat(walletTokens) > 100.0) {
      referralMessage = (
        <Message positive>
          <Message.Header>You are eligible to be a masternode</Message.Header>
          <div style={{wordWrap: "break-word"}}>
            <p >
              If your wallet holds 100 tokens, the contract generates a link to your masternode for you! 
            </p>
            <p>
              Whenever someone visits the site via this unique link, they have your masternode stored in a cookie that tracks all purchases of H3D they make, now and in the future.
            </p>

            <p>
              Here is your link: <span style={{fontWeight: 'bold'}}> hodl3d.io/master/{Utils.defaultAccount()} </span>
            </p>
          </div>
        </Message>
      )
    } else {
      referralMessage = (
        <Message warning>
          <Message.Header>Expand the Network!</Message.Header>
          <p >
            If your wallet holds 100 tokens, the contract generates a link to your masternode for you!  
          </p>
          <p>
            Whenever someone visits the site via this unique link, they have your masternode stored in a cookie that tracks all purchases of H3D they make, now and in the future.
          </p>
        </Message>
      )
    }

    return (
      <div className="App" style={{backgroundColor: '#f4f4f4', marginTop: '0px'}}>
        <Header as='h2' icon textAlign='center'>
          <Icon name='users' circular />
          <Header.Content>Hodl3D</Header.Content>
          <Header.Subheader>"I sold my house for this -Inventor"</Header.Subheader>
        </Header>
        <Grid centered padded>
          <ToastContainer />
          <Grid.Row>
            <Grid.Column>
              <Container>
                <Segment>
                  <Grid.Row>
                    <Header size='medium'> Account Info</Header>
                    <Divider />
                    <Segment.Group>
                      <Segment>
                        <div style={{wordWrap: "break-word"}}>
                          <Icon circular color='teal' name='address card' />
                          <span> <strong> Address </strong> : {Utils.defaultAccount()} </span>
                        </div>
                      </Segment>
                      <Segment>
                        <Icon circular color='teal' name='ethereum' />
                        <span> <strong> ETH Balance </strong> : { ethBalance } </span>
                      </Segment>
                    </Segment.Group>
                  </Grid.Row>
                </Segment>
              </Container>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <Container>
                <Segment>
                  <Grid.Row>
                    <Header size='medium'> Network Status </Header>
                    <Divider />
                    <Segment.Group>
                      <Segment>
                        <span> <strong> ETH in contract </strong> : {networkETH} </span>
                      </Segment>
                      <Segment>
                        <span> <strong> Token in circulation </strong> : {networkTokens} </span>
                      </Segment>
                      <Segment>
                        <span> <strong> Token Price </strong> : { buyPrice } </span>
                      </Segment>
                    </Segment.Group>
                  </Grid.Row>
                </Segment>
              </Container>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <Container>
                <Segment>
                  <Grid.Row>
                    <Header size='medium'> Wallet </Header>
                    <Segment.Group>
                      <Segment>
                        <span> <strong> Tokens </strong> : { walletTokens } H3D </span>
                      </Segment>
                      <Segment>
                        <span> <strong> Dividends </strong> : { walletDividends } ETH </span>
                      </Segment>
                      <Segment>
                        <span> <strong> Referal (Included in the Dividends) </strong> : { walletReferralBonus } ETH </span>
                      </Segment>
                    </Segment.Group>
                    { referralMessage }
                    <Divider />
                  </Grid.Row>
                  <Grid.Column width={4}>
                    <Grid.Row centered style={{marginTop: '5px'}}>
                      <Button primary fluid size={"small"} onClick={this.reinvestOnSubmit} > Reinvest dividends </Button>
                    </Grid.Row>
                    <Grid.Row centered style={{marginTop: '5px'}}>
                      <Button primary fluid size={"small"} onClick={this.withdrawOnSubmit} > Withdraw dividends </Button>
                    </Grid.Row>
                    <Grid.Row centered style={{marginTop: '5px'}}>
                      <Button primary fluid size={"small"} onClick={this.etherscanOnSubmit}> View Etherscan </Button>
                    </Grid.Row>
                  </Grid.Column>
                </Segment>
              </Container>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <Container>
                <Segment>
                  <Grid.Row>
                    <Header size='medium' >
                      <Header.Content>Buy</Header.Content>
                    </Header>
                    <Message>
                      <Message.Header> </Message.Header>
                      <p>
                        Due to Network Congestion, please use more than 10 gwei gas prices.
                      </p>
                    </Message>
                    <Divider />
                    <Grid.Column>
                      <span> { buyPrice } ETH/Token </span>
                    </Grid.Column>
                    <Grid.Column>
                      <Input
                        placeholder='0.05'
                        onChange={this.buyAmountOnChange}
                        label={{ basic: true, content: 'ETH' }}
                        labelPosition='right' />
                      <Button primary onClick={this.buyOnSubmit}> Buy </Button>
                    </Grid.Column>
                    <Message info>
                      <p>
                        You will receive approximately { tokensToReceive } Tokens
                      </p>
                    </Message>
                  </Grid.Row>
                </Segment>
              </Container>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <Container>
                <Segment>
                  <Grid.Row>
                    <Header size='medium'>
                      <Header.Content>Sell</Header.Content>
                    </Header>
                    <Message>
                      <Message.Header> </Message.Header>
                      <p>
                        Note that ETH received will be added to your dividends
                      </p>
                    </Message>
                    <Divider />
                    <Grid.Column>
                      <span> { sellPrice } ETH/Token </span>
                    </Grid.Column>
                    <Grid.Column>
                      <Input placeholder='0.05'
                        onChange={this.sellAmountOnChange}
                        label={{ basic: true, content: 'H3D' }}
                        labelPosition='right'
                      />
                      <Button primary onClick={this.sellOnSubmit}> Sell </Button>
                    </Grid.Column>
                    <Message info>
                      <p>
                        You will receive approximately { ethToReceive } ETH
                      </p>
                    </Message>
                  </Grid.Row>
                </Segment>
              </Container>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    );
  }
}

const mapStateToProps = state => {
  console.log(state.service)
  return {
    buyPrice: state.service.buyPrice,
    sellPrice: state.service.sellPrice,
    networkETH: state.service.networkETH,
    networkTokens: state.service.networkTokens,
    walletTokens: state.service.walletTokens,
    walletDividends: state.service.walletDividends,
    tokensToReceive: state.service.tokensToReceive,
    ethToReceive: state.service.ethToReceive,
    ethBalance: state.service.ethBalance,
    walletReferralBonus: state.service.walletReferralBonus
  }
}

function mapDispatchToProps(dispatch) {
  return({
    getData: () => {dispatch(getData())},
    buy: (eth, master) => {dispatch(buy(eth, master))},
    sell: (tokens) => {dispatch(sell(tokens))},
    calculateTokensReceived: (eth) => {dispatch(calculateTokensReceived(eth))},
    calculateEthereumReceived: (tokens) => {dispatch(calculateEthereumReceived(tokens))},
    reinvest: () => {dispatch(reinvest())},
    withdraw: () => {dispatch(withdraw())}
  })
}


export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App)

