const Token = artifacts.require('./Token.sol')
const SafeMath = artifacts.require('./SafeMath.sol')
const FoMo3Dlong = artifacts.require('./FoMo3Dlong.sol')
const JIincForwarder = artifacts.require('./JIincForwarder.sol')

module.exports = function(deployer, network, accounts) {
  deployer.deploy(SafeMath).then(function() {
    return deployer.link(SafeMath, [Token, FoMo3Dlong])
  }).then(function() {
    return deployer.deploy(Token)
  }).then(function() {
    return deployer.deploy(JIincForwarder)
  }).then(function() {
    return deployer.deploy(FoMo3Dlong, '0xB1196823E928F8BEa57d8EFD0b299ffbE7CABB46', Token.address, 1000)
  })
};
