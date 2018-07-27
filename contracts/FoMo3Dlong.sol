pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

import "./interface/JIincForwarderInterface.sol";
import "./interface/F3DexternalSettingsInterface.sol";
import "./library/SafeMath.sol";
import "./library/F3DKeysCalcLong.sol";
import "./library/F3Ddatasets.sol";


import "./modularLong.sol";

contract FoMo3Dlong is modularLong {
    using SafeMath for *;
    using F3DKeysCalcLong for uint256;

    JIincForwarderInterface private Jekyll_Island_Inc;
    F3DexternalSettingsInterface private extSettings;
    ERC20 public token;
    uint decimals = 18;
    //==============================================================================
    //     _ _  _  |`. _     _ _ |_ | _  _  .
    //    (_(_)| |~|~|(_||_|| (_||_)|(/__\  .  (game settings)
    //=================_|===========================================================
    string constant public name = "FoMo3D Long Official";
    string constant public symbol = "F3D";
    uint256 private rndExtra_ = 2 hours;
    uint256 private rndGap_ = 3 hours;
    // uint256 private rndExtra_ = extSettings.getLongExtra();     // length of the very first ICO 
    // uint256 private rndGap_ = extSettings.getLongGap();         // length of ICO phase, set to 1 year for EOS.
    uint256 constant private rndInit_ = 1 hours;                // round timer starts at this
    uint256 constant private rndInc_ = 30 seconds;              // every full key purchased adds this much to the timer
    uint256 constant private rndMax_ = 24 hours;                // max length a round timer can be
    //==============================================================================
    //     _| _ _|_ _    _ _ _|_    _   .
    //    (_|(_| | (_|  _\(/_ | |_||_)  .  (data used to store game info that changes)
    //=============================|================================================
    uint256 public rID_;    // round id number / total rounds that have happened
    //****************
    // PLAYER DATA 
    //****************
    mapping (address => F3Ddatasets.Player) public plyr_;   // (pID => data) player data
    mapping (address => mapping (uint256 => F3Ddatasets.PlayerRounds)) public plyrRnds_;    // (pID => rID => data) player round data by player id & round id
    //****************
    // ROUND DATA 
    //****************
    mapping (uint256 => F3Ddatasets.Round) public round_;   // (rID => data) round data
    mapping (uint256 => mapping(uint256 => uint256)) public rndTmEth_;      // (rID => tID => data) eth in per team, by round id and team id
    //****************
    // TEAM FEE DATA 
    //****************
    mapping (uint256 => F3Ddatasets.TeamFee) public fees_;          // (team => fees) fee distribution by team
    mapping (uint256 => F3Ddatasets.PotSplit) public potSplit_;     // (team => fees) pot split distribution by team
    //==============================================================================
    //     _ _  _  __|_ _    __|_ _  _  .
    //    (_(_)| |_\ | | |_|(_ | (_)|   .  (initial data setup upon contract deploy)
    //==============================================================================
    constructor(address Jekyll_Island_Inc_Addr, address F3DexternalSettingsAddr, address tokenAddr)
        public
        {
            Jekyll_Island_Inc = JIincForwarderInterface(Jekyll_Island_Inc_Addr);
            extSettings = F3DexternalSettingsInterface(F3DexternalSettingsAddr);
            token = ERC20(token);

            // Team allocation structures
            // 0 = whales
            // 1 = bears
            // 2 = sneks
            // 3 = bulls

            // Team allocation percentages
            // (F3D, P3D) + (Pot , Referrals, Community)
            // Referrals / Community rewards are mathematically designed to come from the winner's share of the pot.
            fees_[0] = F3Ddatasets.TeamFee(30,0);   //50% to pot, 10% to aff, 2% to com
            fees_[1] = F3Ddatasets.TeamFee(43,0);   //43% to pot, 10% to aff, 2% to com
            fees_[2] = F3Ddatasets.TeamFee(56,0);  //20% to pot, 10% to aff, 2% to com
            fees_[3] = F3Ddatasets.TeamFee(43,0);   //35% to pot, 10% to aff, 2% to com
        
            // how to split up the final pot based on which team was picked
            // (F3D, P3D)
            potSplit_[0] = F3Ddatasets.PotSplit(15,0);  //48% to winner, 25% to next round, 2% to com
            potSplit_[1] = F3Ddatasets.PotSplit(25,0);   //48% to winner, 25% to next round, 2% to com
            potSplit_[2] = F3Ddatasets.PotSplit(20,0);  //48% to winner, 10% to next round, 2% to com
            potSplit_[3] = F3Ddatasets.PotSplit(30,0);  //48% to winner, 10% to next round, 2% to com
        }
    //==============================================================================
    //     _ _  _  _|. |`. _  _ _  .
    //    | | |(_)(_||~|~|(/_| _\  .  (these are safety checks)
    //==============================================================================
    /**
     * @dev used to make sure no one can interact with contract until it has 
     * been activated. 
     */
    modifier isActivated() {
        require(activated_ == true, "its not ready yet.  check ?eta in discord"); 
        _;
    }
    
    /**
     * @dev prevents contracts from interacting with fomo3d 
     */
    modifier isHuman() {
        address _addr = msg.sender;
        uint256 _codeLength;
        
        assembly {_codeLength := extcodesize(_addr)}
        require(_codeLength == 0, "sorry humans only");
        _;
    }

    /**
     * @dev sets boundaries for incoming tx 
     */
    modifier isWithinLimits(uint256 _eth) {
        uint base = 10**decimals;

        require(_eth >= 1*base, "pocket lint: not a valid currency");
        require(_eth <= 10000000*base, "no vitalik, no");
        _;
    }
    
    //==============================================================================
    //     _    |_ |. _   |`    _  __|_. _  _  _  .
    //    |_)|_||_)||(_  ~|~|_|| |(_ | |(_)| |_\  .  (use these to interact with contract)
    //====|=========================================================================
    /**
     * @dev converts all incoming ethereum to keys.
     * -functionhash- 0x98a0871d (using address for affiliate)
     * @param _affCode the address of the player who gets the affiliate fee
     * @param _team what team is the player playing for?
     */
    function buyXaddr(address _affCode, uint256 _team, uint val)
        isActivated()
        isHuman()
        isWithinLimits(val)
        public
    {
        F3Ddatasets.EventReturns memory _eventData_;

        require(token.transferFrom(msg.sender, address(this), val), "Approve more ethers to be spent by this contract");

        // fetch player id
        address _pID = msg.sender;

        // manage affiliate residuals
        address _affID;
        // if no affiliate code was given or player tried to use their own, lolz
        if (_affCode == address(0) || _affCode == msg.sender)
            {
                // use last stored affiliate code
                _affID = plyr_[_pID].laff;
        
                // if affiliate code was given    
            } else {
            // get affiliate ID from aff Code 
            _affID = _affCode;
            
            // if affID is not the same as previously stored 
            if (_affID != plyr_[_pID].laff)
                {
                    // update last affiliate
                    plyr_[_pID].laff = _affID;
                }
        }
        
        // verify a valid team was selected
        _team = verifyTeam(_team);
        
        // buy core 
        buyCore(_pID, _affID, _team, val, _eventData_);
    }
    
    /**
     * @dev essentially the same as buy, but instead of you sending ether 
     * from your wallet, it uses your unwithdrawn earnings.
     * -functionhash- 0x349cdcac (using ID for affiliate)
     * -functionhash- 0x82bfc739 (using address for affiliate)
     * -functionhash- 0x079ce327 (using name for affiliate)
     * @param _affCode the ID/address/name of the player who gets the affiliate fee
     * @param _team what team is the player playing for?
     * @param _eth amount of earnings to use (remainder returned to gen vault)
     */
    
    function reLoadXaddr(address _affCode, uint256 _team, uint256 _eth)
        isActivated()
        isHuman()
        isWithinLimits(_eth)
        public
    {
        // set up our tx event data
        F3Ddatasets.EventReturns memory _eventData_;
        
        // fetch player ID
        address _pID = msg.sender;
        
        // manage affiliate residuals
        address _affID;
        // if no affiliate code was given or player tried to use their own, lolz
        if (_affCode == address(0) || _affCode == msg.sender)
            {
                // use last stored affiliate code
                _affID = plyr_[_pID].laff;
        
                // if affiliate code was given    
            } else {
            // get affiliate ID from aff Code 
            _affID = _affCode;
            
            // if affID is not the same as previously stored 
            if (_affID != plyr_[_pID].laff)
                {
                    // update last affiliate
                    plyr_[_pID].laff = _affID;
                }
        }
        
        // verify a valid team was selected
        _team = verifyTeam(_team);
        
        // reload core
        reLoadCore(_pID, _affID, _team, _eth, _eventData_);
    }

    /**
     * @dev withdraws all of your earnings.
     * -functionhash- 0x3ccfd60b
     */
    function withdraw()
        isActivated()
        isHuman()
        public
    {
        // setup local rID 
        uint256 _rID = rID_;
        
        // grab time
        uint256 _now = now;
        
        // fetch player ID
        address _pID = msg.sender;
        
        // setup temp var for player eth
        uint256 _eth;
        
        // check to see if round has ended and no one has run round end yet
        if (_now > round_[_rID].end && round_[_rID].ended == false && round_[_rID].plyr != 0)
            {
                // set up our tx event data
                F3Ddatasets.EventReturns memory _eventData_;
            
                // end the round (distributes pot)
                round_[_rID].ended = true;
                _eventData_ = endRound(_eventData_);
            
                // get their earnings
                _eth = withdrawEarnings(_pID);
            
                // gib moni
                // CHANGE THIS
                if (_eth > 0)
                    token.transfer(plyr_[_pID].addr, eth)
            
                // build event data
                _eventData_.compressedData = _eventData_.compressedData + (_now * 1000000000000000000);
                _eventData_.compressedIDs = _eventData_.compressedIDs + uint256(_pID);
            
                // fire withdraw and distribute event
                emit F3Devents.onWithdrawAndDistribute
                    (
                     msg.sender, 
                     _eth, 
                     _eventData_.compressedData, 
                     _eventData_.compressedIDs, 
                     _eventData_.winnerAddr, 
                     _eventData_.amountWon, 
                     _eventData_.newPot, 
                     _eventData_.P3DAmount, 
                     _eventData_.genAmount
                     );
            
                // in any other situation
            } else {
            // get their earnings
            _eth = withdrawEarnings(_pID);
            
            // gib moni
            if (_eth > 0)
                token.transfer(plyr_[_pID].addr, eth)
            
            // fire withdraw event
            emit F3Devents.onWithdraw(_pID, _eth, _now);
        }
    }

    //==============================================================================
    //     _  _ _|__|_ _  _ _  .
    //    (_|(/_ |  | (/_| _\  . (for UI & viewing things on etherscan)
    //=====_|=======================================================================
    /**
     * @dev return the price buyer will pay for next 1 individual key.
     * -functionhash- 0x018a25e8
     * @return price for next key bought (in wei format)
     */
    function getBuyPrice()
        public 
        view 
        returns(uint256)
    {  
        // setup local rID
        uint256 _rID = rID_;
        
        // grab time
        uint256 _now = now;
        
        // are we in a round?
        if (_now > round_[_rID].strt + rndGap_ && (_now <= round_[_rID].end || (_now > round_[_rID].end && round_[_rID].plyr == 0)))
            return ( (round_[_rID].keys.add(1000000000000000000)).ethRec(1000000000000000000) );
        else // rounds over.  need price for new round
            return ( 75000000000000 ); // init
    }
    
    /**
     * @dev returns time left.  dont spam this, you'll ddos yourself from your node 
     * provider
     * -functionhash- 0xc7e284b8
     * @return time left in seconds
     */
    function getTimeLeft()
        public
        view
        returns(uint256)
    {
        // setup local rID
        uint256 _rID = rID_;
        
        // grab time
        uint256 _now = now;
        
        if (_now < round_[_rID].end)
            if (_now > round_[_rID].strt + rndGap_)
                return( (round_[_rID].end).sub(_now) );
            else
                return( (round_[_rID].strt + rndGap_).sub(_now) );
        else
            return(0);
    }
    
    /**
     * @dev returns player earnings per vaults 
     * -functionhash- 0x63066434
     * @return winnings vault
     * @return general vault
     * @return affiliate vault
     */
    function getPlayerVaults(address _pID)
        public
        view
        returns(uint256 ,uint256, uint256)
    {
        // setup local rID
        uint256 _rID = rID_;
        
        // if round has ended.  but round end has not been run (so contract has not distributed winnings)
        if (now > round_[_rID].end && round_[_rID].ended == false && round_[_rID].plyr != 0)
            {
                // if player is winner 
                if (round_[_rID].plyr == _pID)
                    {
                        return
                            (
                             (plyr_[_pID].win).add( ((round_[_rID].pot).mul(48)) / 100 ),
                             (plyr_[_pID].gen).add(  getPlayerVaultsHelper(_pID, _rID).sub(plyrRnds_[_pID][_rID].mask)   ),
                             plyr_[_pID].aff
                             );
                        // if player is not the winner
                    } else {
                    return
                        (
                         plyr_[_pID].win,
                         (plyr_[_pID].gen).add(  getPlayerVaultsHelper(_pID, _rID).sub(plyrRnds_[_pID][_rID].mask)  ),
                         plyr_[_pID].aff
                         );
                }
            
                // if round is still going on, or round has ended and round end has been ran
            } else {
            return
                (
                 plyr_[_pID].win,
                 (plyr_[_pID].gen).add(calcUnMaskedEarnings(_pID, plyr_[_pID].lrnd)),
                 plyr_[_pID].aff
                 );
        }
    }
    
    /**
     * solidity hates stack limits.  this lets us avoid that hate 
     */
    function getPlayerVaultsHelper(address _pID, uint256 _rID)
        private
        view
        returns(uint256)
    {
        //                                   ---------------------------- # eth / key * 1000000000000000000 --------------------------------------------------- | plyr's # keys
        return(  ((((round_[_rID].mask).add(((((round_[_rID].pot).mul(potSplit_[round_[_rID].team].gen)) / 100).mul(1000000000000000000)) / (round_[_rID].keys))).mul(plyrRnds_[_pID][_rID].keys)) / 1000000000000000000)  );
    }
    
    /**
     * @dev returns all current round info needed for front end
     * -functionhash- 0x747dff42
     * @return eth invested during ICO phase
     * @return round id 
     * @return total keys for round 
     * @return time round ends
     * @return time round started
     * @return current pot 
     * @return current team ID
     * @return current player in leads address 
     * @return whales eth in for round
     * @return bears eth in for round
     * @return sneks eth in for round
     * @return bulls eth in for round
     */
    function getCurrentRoundInfo()
        public
        view
        returns(uint256, uint256, uint256, uint256, uint256, uint256, uint256, address, uint256, uint256, uint256, uint256)
    {
        // setup local rID
        uint256 _rID = rID_;
        
        return
            (
             round_[_rID].ico,               //0
             _rID,                           //1
             round_[_rID].keys,              //2
             round_[_rID].end,               //3
             round_[_rID].strt,              //4
             round_[_rID].pot,               //5
             round_[_rID].team,              //6
             round_[_rID].plyr,              //7
             rndTmEth_[_rID][0],             //8
             rndTmEth_[_rID][1],             //9
             rndTmEth_[_rID][2],             //10
             rndTmEth_[_rID][3]              //11
             );
    }

    /**
     * @dev returns player info based on address.  if no address is given, it will 
     * use msg.sender 
     * -functionhash- 0xee0b5d8b
     * @param _addr address of the player you want to lookup 
     * @return player ID 
     * @return player name
     * @return keys owned (current round)
     * @return winnings vault
     * @return general vault 
     * @return affiliate vault 
     * @return player round eth
     */
    function getPlayerInfoByAddress(address _addr)
        public 
        view 
        returns(address, uint256, uint256, uint256, uint256, uint256)
    {
        // setup local rID
        uint256 _rID = rID_;
 
        address _pID = _addr;
        return
            (
             _pID,                               //0
             plyrRnds_[_pID][_rID].keys,         //1
             plyr_[_pID].win,                    //2
             (plyr_[_pID].gen).add(calcUnMaskedEarnings(_pID, plyr_[_pID].lrnd)),       //3
             plyr_[_pID].aff,                    //4
             plyrRnds_[_pID][_rID].eth           //5
             );
    }

    //==============================================================================
    //     _ _  _ _   | _  _ . _  .
    //    (_(_)| (/_  |(_)(_||(_  . (this + tools + calcs + modules = our softwares engine)
    //=====================_|=======================================================
    /**
     * @dev logic runs whenever a buy order is executed.  determines how to handle 
     * incoming eth depending on if we are in an active round or not
     */
    function buyCore(address _pID, address _affID, uint256 _team, uint val, F3Ddatasets.EventReturns memory _eventData_)
        private
    {
        // setup local rID
        uint256 _rID = rID_;
        
        // grab time
        uint256 _now = now;
        
        // if round is active
        if (_now > round_[_rID].strt + rndGap_ && (_now <= round_[_rID].end || (_now > round_[_rID].end && round_[_rID].plyr == 0))) 
            {
                // call core 
                core(_rID, _pID, val, _affID, _team, _eventData_);
        
                // if round is not active     
            } else {
            // check to see if end round needs to be ran
            if (_now > round_[_rID].end && round_[_rID].ended == false) 
                {
                    // end the round (distributes pot) & start new round
                    round_[_rID].ended = true;
                    _eventData_ = endRound(_eventData_);
                
                    // build event data
                    _eventData_.compressedData = _eventData_.compressedData + (_now * 1000000000000000000);
                    _eventData_.compressedIDs = _eventData_.compressedIDs + uint256(_pID);
                
                    // fire buy and distribute event 
                    emit F3Devents.onBuyAndDistribute
                        (
                         msg.sender,
                         msg.value,
                         _eventData_.compressedData, 
                         _eventData_.compressedIDs, 
                         _eventData_.winnerAddr, 
                         _eventData_.winnerName, 
                         _eventData_.amountWon, 
                         _eventData_.newPot, 
                         _eventData_.P3DAmount, 
                         _eventData_.genAmount
                         );
                }
            
            // put eth in players vault 
            plyr_[_pID].gen = plyr_[_pID].gen.add(val);
        }
    }
    
    /**
     * @dev logic runs whenever a reload order is executed.  determines how to handle 
     * incoming eth depending on if we are in an active round or not 
     */
    function reLoadCore(address _pID, address _affID, uint256 _team, uint256 _eth, F3Ddatasets.EventReturns memory _eventData_)
        private
    {
        // setup local rID
        uint256 _rID = rID_;
        
        // grab time
        uint256 _now = now;
        
        // if round is active
        if (_now > round_[_rID].strt + rndGap_ && (_now <= round_[_rID].end || (_now > round_[_rID].end && round_[_rID].plyr == 0))) 
            {
                // get earnings from all vaults and return unused to gen vault
                // because we use a custom safemath library.  this will throw if player 
                // tried to spend more eth than they have.
                plyr_[_pID].gen = withdrawEarnings(_pID).sub(_eth);
            
                // call core 
                core(_rID, _pID, _eth, _affID, _team, _eventData_);
        
                // if round is not active and end round needs to be ran   
            } else if (_now > round_[_rID].end && round_[_rID].ended == false) {
            // end the round (distributes pot) & start new round
            round_[_rID].ended = true;
            _eventData_ = endRound(_eventData_);
                
            // build event data
            _eventData_.compressedData = _eventData_.compressedData + (_now * 1000000000000000000);
            _eventData_.compressedIDs = _eventData_.compressedIDs + uint256(_pID);
                
            // fire buy and distribute event 
            emit F3Devents.onReLoadAndDistribute
                (
                 msg.sender, 
                 _eventData_.compressedData, 
                 _eventData_.compressedIDs, 
                 _eventData_.winnerAddr, 
                 _eventData_.winnerName, 
                 _eventData_.amountWon, 
                 _eventData_.newPot, 
                 _eventData_.P3DAmount, 
                 _eventData_.genAmount
                 );
        }
    }
    
    /**
     * @dev this is the core logic for any buy/reload that happens while a round 
     * is live.
     */
    function core(uint256 _rID, address _pID, uint256 _eth, address _affID, uint256 _team, F3Ddatasets.EventReturns memory _eventData_)
        private
    {
        // if player is new to round
        if (plyrRnds_[_pID][_rID].keys == 0)
            _eventData_ = managePlayer(_pID, _eventData_);
        
        // early round eth limiter 
        if (round_[_rID].eth < 100000000000000000000 && plyrRnds_[_pID][_rID].eth.add(_eth) > 1000000000000000000)
            {
                uint256 _availableLimit = (1000000000000000000).sub(plyrRnds_[_pID][_rID].eth);
                uint256 _refund = _eth.sub(_availableLimit);
                plyr_[_pID].gen = plyr_[_pID].gen.add(_refund);
                _eth = _availableLimit;
            }
        
        // if eth left is greater than min eth allowed (sorry no pocket lint)
        if (_eth > 1000000000) 
            {
                // mint the new keys
                uint256 _keys = (round_[_rID].eth).keysRec(_eth);
                // if they bought at least 1 whole key
                if (_keys >= 1000000000000000000)
                    {
                        updateTimer(_keys, _rID);

                        // set new leaders
                        if (round_[_rID].plyr != _pID)
                            round_[_rID].plyr = _pID;  
                        if (round_[_rID].team != _team)
                            round_[_rID].team = _team; 
                        // set the new leader bool to true
                        _eventData_.compressedData = _eventData_.compressedData + 100;
                    }
            
                // update player 
                plyrRnds_[_pID][_rID].keys = _keys.add(plyrRnds_[_pID][_rID].keys);
                plyrRnds_[_pID][_rID].eth = _eth.add(plyrRnds_[_pID][_rID].eth);
            
                // update round
                round_[_rID].keys = _keys.add(round_[_rID].keys);
                round_[_rID].eth = _eth.add(round_[_rID].eth);
                rndTmEth_[_rID][_team] = _eth.add(rndTmEth_[_rID][_team]);
    
                // distribute eth
                _eventData_ = distributeExternal(_rID, _pID, _eth, _affID, _eventData_);
                _eventData_ = distributeInternal(_rID, _pID, _eth, _team, _keys, _eventData_);
            
                // call end tx function to fire end tx event.
                endTx(_pID, _team, _eth, _keys, _eventData_);
            }
    }
    //==============================================================================
    //     _ _ | _   | _ _|_ _  _ _  .
    //    (_(_||(_|_||(_| | (_)| _\  .
    //==============================================================================
    /**
     * @dev calculates unmasked earnings (just calculates, does not update mask)
     * @return earnings in wei format
     */
    function calcUnMaskedEarnings(address _pID, uint256 _rIDlast)
        private
        view
        returns(uint256)
    {
        return(  (((round_[_rIDlast].mask).mul(plyrRnds_[_pID][_rIDlast].keys)) / (1000000000000000000)).sub(plyrRnds_[_pID][_rIDlast].mask)  );
    }
    
    /** 
     * @dev returns the amount of keys you would get given an amount of eth. 
     * -functionhash- 0xce89c80c
     * @param _rID round ID you want price for
     * @param _eth amount of eth sent in 
     * @return keys received 
     */
    function calcKeysReceived(uint256 _rID, uint256 _eth)
        public
        view
        returns(uint256)
    {
        // grab time
        uint256 _now = now;
        
        // are we in a round?
        if (_now > round_[_rID].strt + rndGap_ && (_now <= round_[_rID].end || (_now > round_[_rID].end && round_[_rID].plyr == 0)))
            return ( (round_[_rID].eth).keysRec(_eth) );
        else // rounds over.  need keys for new round
            return ( (_eth).keys() );
    }
    
    /** 
     * @dev returns current eth price for X keys.  
     * -functionhash- 0xcf808000
     * @param _keys number of keys desired (in 18 decimal format)
     * @return amount of eth needed to send
     */
    function iWantXKeys(uint256 _keys)
        public
        view
        returns(uint256)
    {
        // setup local rID
        uint256 _rID = rID_;
        
        // grab time
        uint256 _now = now;
        
        // are we in a round?
        if (_now > round_[_rID].strt + rndGap_ && (_now <= round_[_rID].end || (_now > round_[_rID].end && round_[_rID].plyr == 0)))
            return ( (round_[_rID].keys.add(_keys)).ethRec(_keys) );
        else // rounds over.  need price for new round
            return ( (_keys).eth() );
    }
    //==============================================================================
    //    _|_ _  _ | _  .
    //     | (_)(_)|_\  .
    //==============================================================================
    /**
     * @dev checks to make sure user picked a valid team.  if not sets team 
     * to default (sneks)
     */
    function verifyTeam(uint256 _team)
        private
        pure
        returns (uint256)
    {
        if (_team < 0 || _team > 3)
            return(2);
        else
            return(_team);
    }
    
    /**
     * @dev decides if round end needs to be run & new round started.  and if 
     * player unmasked earnings from previously played rounds need to be moved.
     */
    function managePlayer(address _pID, F3Ddatasets.EventReturns memory _eventData_)
        private
        returns (F3Ddatasets.EventReturns)
    {
        // if player has played a previous round, move their unmasked earnings
        // from that round to gen vault.
        if (plyr_[_pID].lrnd != 0)
            updateGenVault(_pID, plyr_[_pID].lrnd);
            
        // update player's last round played
        plyr_[_pID].lrnd = rID_;
            
        // set the joined round bool to true
        _eventData_.compressedData = _eventData_.compressedData + 10;
        
        return(_eventData_);
    }
    
    /**
     * @dev ends the round. manages paying out winner/splitting up pot
     */
    function endRound(F3Ddatasets.EventReturns memory _eventData_)
        private
        returns (F3Ddatasets.EventReturns)
    {
        // setup local rID
        uint256 _rID = rID_;
        
        // grab our winning player and team id's
        address _winPID = round_[_rID].plyr;
        uint256 _winTID = round_[_rID].team;
        
        // grab our pot amount
        uint256 _pot = round_[_rID].pot;
        
        // calculate our winner share, community rewards, gen share, 
        // p3d share, and amount reserved for next pot 
        uint256 _win = (_pot.mul(48)) / 100;
        uint256 _com = (_pot / 50);
        uint256 _gen = (_pot.mul(potSplit_[_winTID].gen)) / 100;
        uint256 _p3d = (_pot.mul(potSplit_[_winTID].p3d)) / 100;
        uint256 _res = (((_pot.sub(_win)).sub(_com)).sub(_gen)).sub(_p3d);
        
        // calculate ppt for round mask
        uint256 _ppt = (_gen.mul(1000000000000000000)) / (round_[_rID].keys);
        uint256 _dust = _gen.sub((_ppt.mul(round_[_rID].keys)) / 1000000000000000000);
        if (_dust > 0)
            {
                _gen = _gen.sub(_dust);
                _res = _res.add(_dust);
            }
        
        // pay our winner
        plyr_[_winPID].win = _win.add(plyr_[_winPID].win);
        
        // community rewards
        if (!address(Jekyll_Island_Inc).call.value(_com)(bytes4(keccak256("deposit()"))))
            {
                // This ensures Team Just cannot influence the outcome of FoMo3D with
                // bank migrations by breaking outgoing transactions.
                // Something we would never do. But that's not the point.
                // We spent 2000$ in eth re-deploying just to patch this, we hold the 
                // highest belief that everything we create should be trustless.
                // Team JUST, The name you shouldn't have to trust.
                _p3d = _p3d.add(_com);
                _com = 0;
            }
        
        // distribute gen portion to key holders
        round_[_rID].mask = _ppt.add(round_[_rID].mask);
        
        // send share for p3d to divies
        /*
        if (_p3d > 0)
            Divies.deposit.value(_p3d)();
        */

        // prepare event data
        _eventData_.compressedData = _eventData_.compressedData + (round_[_rID].end * 1000000);
        _eventData_.compressedIDs = _eventData_.compressedIDs + (uint256(_winPID) * 100000000000000000000000000) + (_winTID * 100000000000000000);
        _eventData_.winnerAddr = plyr_[_winPID].addr;
        _eventData_.amountWon = _win;
        _eventData_.genAmount = _gen;
        _eventData_.P3DAmount = _p3d;
        _eventData_.newPot = _res;
        
        // start next round
        rID_++;
        _rID++;
        round_[_rID].strt = now;
        round_[_rID].end = now.add(rndInit_).add(rndGap_);
        round_[_rID].pot = _res;
        
        return(_eventData_);
    }
    
    /**
     * @dev moves any unmasked earnings to gen vault.  updates earnings mask
     */
    function updateGenVault(address _pID, uint256 _rIDlast)
        private 
    {
        uint256 _earnings = calcUnMaskedEarnings(_pID, _rIDlast);
        if (_earnings > 0)
            {
                // put in gen vault
                plyr_[_pID].gen = _earnings.add(plyr_[_pID].gen);
                // zero out their earnings by updating mask
                plyrRnds_[_pID][_rIDlast].mask = _earnings.add(plyrRnds_[_pID][_rIDlast].mask);
            }
    }
    
    /**
     * @dev updates round timer based on number of whole keys bought.
     */
    function updateTimer(uint256 _keys, uint256 _rID)
        private
    {
        // grab time
        uint256 _now = now;
        
        // calculate time based on number of keys bought
        uint256 _newTime;
        if (_now > round_[_rID].end && round_[_rID].plyr == 0)
            _newTime = (((_keys) / (1000000000000000000)).mul(rndInc_)).add(_now);
        else
            _newTime = (((_keys) / (1000000000000000000)).mul(rndInc_)).add(round_[_rID].end);
        
        // compare to max and set new end time
        if (_newTime < (rndMax_).add(_now))
            round_[_rID].end = _newTime;
        else
            round_[_rID].end = rndMax_.add(_now);
    }

    /**
     * @dev distributes eth based on fees to com, aff, and p3d
     */
    function distributeExternal(uint256 _rID, address _pID, uint256 _eth, address _affID, F3Ddatasets.EventReturns memory _eventData_)
        private
        returns(F3Ddatasets.EventReturns)
    {
        // CHANGE THIS
        // pay 2% out to community rewards
        uint256 _com = _eth / 50;
        if (!address(Jekyll_Island_Inc).call.value(_com)(bytes4(keccak256("deposit()"))))
            {
                // This ensures Team Just cannot influence the outcome of FoMo3D with
                // bank migrations by breaking outgoing transactions.
                // Something we would never do. But that's not the point.
                // We spent 2000$ in eth re-deploying just to patch this, we hold the 
                // highest belief that everything we create should be trustless.
                // Team JUST, The name you shouldn't have to trust.
                _com = 0;
            }

        // distribute share to affiliate
        uint256 _aff = _eth / 10;
        
        // decide what to do with affiliate share of fees
        // affiliate must not be self, and must have a name registered
        if (_affID != _pID) {
            plyr_[_affID].aff = _aff.add(plyr_[_affID].aff);
            emit F3Devents.onAffiliatePayout(_affID, _rID, _pID, _aff, now);
        }

        return(_eventData_);
    }

    /**
     * @dev distributes eth based on fees to gen and pot
     */
    function distributeInternal(uint256 _rID, address _pID, uint256 _eth, uint256 _team, uint256 _keys, F3Ddatasets.EventReturns memory _eventData_)
        private
        returns(F3Ddatasets.EventReturns)
    {
        // calculate gen share
        uint256 _gen = (_eth.mul(fees_[_team].gen)) / 100;
        
        // update eth balance (eth = eth - (com share + aff share + p3d share))
        // WARNING: P3D MUST BE ZERO
        _eth = _eth.sub(((_eth.mul(12)) / 100).add((_eth.mul(fees_[_team].p3d)) / 100));
        
        // calculate pot 
        uint256 _pot = _eth.sub(_gen);
        
        // distribute gen share (thats what updateMasks() does) and adjust
        // balances for dust.
        uint256 _dust = updateMasks(_rID, _pID, _gen, _keys);
        if (_dust > 0)
            _gen = _gen.sub(_dust);
        
        // add eth to pot
        round_[_rID].pot = _pot.add(_dust).add(round_[_rID].pot);
        
        // set up event data
        _eventData_.genAmount = _gen.add(_eventData_.genAmount);
        _eventData_.potAmount = _pot;
        
        return(_eventData_);
    }

    /**
     * @dev updates masks for round and player when keys are bought
     * @return dust left over 
     */
    function updateMasks(uint256 _rID, address _pID, uint256 _gen, uint256 _keys)
        private
        returns(uint256)
    {
        /* MASKING NOTES
           earnings masks are a tricky thing for people to wrap their minds around.
           the basic thing to understand here.  is were going to have a global
           tracker based on profit per share for each round, that increases in
           relevant proportion to the increase in share supply.
            
           the player will have an additional mask that basically says "based
           on the rounds mask, my shares, and how much i've already withdrawn,
           how much is still owed to me?"
        */
        
        // calc profit per key & round mask based on this buy:  (dust goes to pot)
        uint256 _ppt = (_gen.mul(1000000000000000000)) / (round_[_rID].keys);
        round_[_rID].mask = _ppt.add(round_[_rID].mask);
            
        // calculate player earning from their own buy (only based on the keys
        // they just bought).  & update player earnings mask
        uint256 _pearn = (_ppt.mul(_keys)) / (1000000000000000000);
        plyrRnds_[_pID][_rID].mask = (((round_[_rID].mask.mul(_keys)) / (1000000000000000000)).sub(_pearn)).add(plyrRnds_[_pID][_rID].mask);
        
        // calculate & return dust
        return(_gen.sub((_ppt.mul(round_[_rID].keys)) / (1000000000000000000)));
    }
    
    /**
     * @dev adds up unmasked earnings, & vault earnings, sets them all to 0
     * @return earnings in wei format
     */
    function withdrawEarnings(address _pID)
        private
        returns(uint256)
    {
        // update gen vault
        updateGenVault(_pID, plyr_[_pID].lrnd);
        
        // from vaults 
        uint256 _earnings = (plyr_[_pID].win).add(plyr_[_pID].gen).add(plyr_[_pID].aff);
        if (_earnings > 0)
            {
                plyr_[_pID].win = 0;
                plyr_[_pID].gen = 0;
                plyr_[_pID].aff = 0;
            }

        return(_earnings);
    }
    
    /**
     * @dev prepares compression data and fires event for buy or reload tx's
     */
    function endTx(address _pID, uint256 _team, uint256 _eth, uint256 _keys, F3Ddatasets.EventReturns memory _eventData_)
        private
    {
        _eventData_.compressedData = _eventData_.compressedData + (now * 1000000000000000000) + (_team * 100000000000000000000000000000);
        _eventData_.compressedIDs = _eventData_.compressedIDs + uint256(_pID) + (rID_ * 10000000000000000000000000000000000000000000000000000);
        
        emit F3Devents.onEndTx
            (
             _eventData_.compressedData,
             _eventData_.compressedIDs,
             msg.sender,
             _eth,
             _keys,
             _eventData_.winnerAddr,
             _eventData_.winnerName,
             _eventData_.amountWon,
             _eventData_.newPot,
             _eventData_.P3DAmount,
             _eventData_.genAmount,
             _eventData_.potAmount
             );
    }
    //==============================================================================
    //    (~ _  _    _._|_    .
    //    _)(/_(_|_|| | | \/  .
    //====================/=========================================================
    /** upon contract deploy, it will be deactivated.  this is a one time
     * use function that will activate the contract.  we do this so devs 
     * have time to set things up on the web end                            **/
    bool public activated_ = false;
    function activate()
        public
    {
        // can only be ran once
        require(activated_ == false, "fomo3d already activated");
        
        // activate the contract 
        activated_ = true;
        
        // lets start first round
        rID_ = 1;
        round_[1].strt = now + rndExtra_ - rndGap_;
        round_[1].end = now + rndInit_ + rndExtra_;
    }
}
