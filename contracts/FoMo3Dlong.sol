pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

import "./library/SafeMath.sol";
import "./library/F3DKeysCalcLong.sol";
import "./library/F3Ddatasets.sol";


import "./modularLong.sol";

contract FoMo3Dlong is modularLong {
    using SafeMath for *;
    using F3DKeysCalcLong for uint256;

    ERC20 public token;
    uint public decimals = 18;
    uint public exchangeRate;
    //==============================================================================
    //     _ _  _  |`. _     _ _ |_ | _  _  .
    //    (_(_)| |~|~|(_||_|| (_||_)|(/__\  .  (game settings)
    //=================_|===========================================================
    string constant public name = "FoMo3D Long Official";
    string constant public symbol = "F3D";
    uint256 public rndExtra_ = 20 seconds;
    uint256 public rndGap_ = 20 seconds;
    // uint256 private rndExtra_ = extSettings.getLongExtra();     // length of the very first ICO 
    // uint256 private rndGap_ = extSettings.getLongGap();         // length of ICO phase, set to 1 year for EOS.
    uint256 constant private rndInit_ = 10 minutes;                // round timer starts at this
    uint256 constant private rndInc_ = 2 seconds;              // every full key purchased adds this much to the timer
    uint256 constant private rndMax_ = 10 minutes;                // max length a round timer can be
    address comAddr;
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
    mapping (address => address) public affID;
    //****************
    // ROUND DATA 
    //****************
    mapping (uint256 => F3Ddatasets.Round) public round_;   // (rID => data) round data
    //****************
    // TEAM FEE DATA 
    //****************
    uint256 public fees_gen = 25;          // fee distribution
    uint256 public potSplit_gen = 25;      // pot split distribution
    //==============================================================================
    //     _ _  _  __|_ _    __|_ _  _  .
    //    (_(_)| |_\ | | |_|(_ | (_)|   .  (initial data setup upon contract deploy)
    //==============================================================================
    constructor(address _comAddr, address tokenAddr, uint _exchangeRate)
        public
        {
            exchangeRate = _exchangeRate;
            token = ERC20(tokenAddr);
            comAddr = _comAddr;
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
        require(_eth >= 1000000000, "pocket lint: not a valid currency");
        require(_eth <= 100000000000000000000000, "no vitalik, no");
        _;
    }
    
    //==============================================================================
    //     _    |_ |. _   |`    _  __|_. _  _  _  .
    //    |_)|_||_)||(_  ~|~|_|| |(_ | |(_)| |_\  .  (use these to interact with contract)
    //====|=========================================================================

    function setupAff(address _pID, address _affCode) private {
        // manage affiliate residuals
        address _affID = affID[_pID];

        // if no affiliate code was given or player tried to use their own, lolz
        if (_affID  == address(0)) {
            // no laff
            if (_affCode != address(0) && _affCode != _pID) {
                // valid _affCode, update laff
                affID[_pID] = _affCode;
            }
        }
    }

    /**
     * @dev converts all incoming ethereum to keys.
     * -functionhash- 0x98a0871d (using address for affiliate)
     * @param _affCode the address of the player who gets the affiliate fee
     */
    function buyXaddr(address _affCode,  uint val)
        isActivated()
        isHuman()
        isWithinLimits(val.div(exchangeRate))
        public
    {
        F3Ddatasets.EventReturns memory _eventData_;

        require(token.transferFrom(msg.sender, address(this), val), "Approve more ethers to be spent by this contract");
        uint eth = val.div(exchangeRate);

        // fetch player id
        address _pID = msg.sender;

        setupAff(_pID, _affCode);
        
        // buy core 
        buyCore(_pID, affID[_pID], eth, _eventData_);
    }
    
    /**
     * @dev essentially the same as buy, but instead of you sending ether 
     * from your wallet, it uses your unwithdrawn earnings.
     * -functionhash- 0x349cdcac (using ID for affiliate)
     * -functionhash- 0x82bfc739 (using address for affiliate)
     * -functionhash- 0x079ce327 (using name for affiliate)
     * @param _affCode the ID/address/name of the player who gets the affiliate fee
     * @param val amount of earnings to use (remainder returned to gen vault)
     */
    
    function reLoadXaddr(address _affCode, uint256 val)
        isActivated()
        isHuman()
        isWithinLimits(val.div(exchangeRate))
        public
    {
        // set up our tx event data
        F3Ddatasets.EventReturns memory _eventData_;

        uint _eth = val.div(exchangeRate);

        // fetch player ID
        address _pID = msg.sender;

        setupAff(_pID, _affCode);

        // reload core
        reLoadCore(_pID, affID[_pID], _eth, _eventData_);
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

        uint val;
        
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
                if (_eth > 0) {
                    val = _eth.mul(exchangeRate);
                    token.transfer(msg.sender, val);
                }
            
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
            if (_eth > 0) {
                val = _eth.mul(exchangeRate);
                token.transfer(msg.sender, val);
            }
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
                             (plyr_[_pID].win).add( ((round_[_rID].pot).mul(50)).div(100) ),
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
        return(  ((((round_[_rID].mask).add(((((round_[_rID].pot).mul(potSplit_gen)) / 100).mul(1000000000000000000)) / (round_[_rID].keys))).mul(plyrRnds_[_pID][_rID].keys)) / 1000000000000000000)  );
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
     */
    function getCurrentRoundInfo()
        public
        view
        returns(uint256, uint256, uint256, uint256, uint256, uint256, uint256, address)
    {
        // setup local rID
        uint256 _rID = rID_;
        
        return
            (
             round_[_rID].eth,               //0
             _rID,                           //1
             round_[_rID].keys,              //2
             round_[_rID].end,               //3
             round_[_rID].strt,              //4
             round_[_rID].pot,               //5
             round_[_rID].team,              //6
             round_[_rID].plyr              //7
             );
    }

    /**
     * @dev returns player info based on address.  if no address is given, it will 
     * use msg.sender 
     * -functionhash- 0xee0b5d8b
     * @param _addr address of the player you want to lookup 
     * @return player ID 
     * @return keys owned (current round)
     * @return unmasked earnings
     * @return player round eth
     */
    function getPlayerInfoByAddress(address _addr)
        public 
        view 
        returns(address, uint256, uint256, uint256)
    {
        // setup local rID
        uint256 _rID = rID_;
 
        address _pID = _addr;
        return
            (
             _pID,                               //0
             plyrRnds_[_pID][_rID].keys,         //1
             calcUnMaskedEarnings(_pID, plyr_[_pID].lrnd),       //2
             plyrRnds_[_pID][_rID].eth           //3
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
    function buyCore(address _pID, address _affID, uint val, F3Ddatasets.EventReturns memory _eventData_)
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
                core(_rID, _pID, val, _affID, _eventData_);
        
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
    function reLoadCore(address _pID, address _affID, uint256 _eth, F3Ddatasets.EventReturns memory _eventData_)
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
                core(_rID, _pID, _eth, _affID, _eventData_);
        
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
    function core(uint256 _rID, address _pID, uint256 _eth, address _affID, F3Ddatasets.EventReturns memory _eventData_)
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
                        // set the new leader bool to true
                        _eventData_.compressedData = _eventData_.compressedData + 100;
                    }
            
                // update player 
                plyrRnds_[_pID][_rID].keys = _keys.add(plyrRnds_[_pID][_rID].keys);
                plyrRnds_[_pID][_rID].eth = _eth.add(plyrRnds_[_pID][_rID].eth);
            
                // update round
                round_[_rID].keys = _keys.add(round_[_rID].keys);
                round_[_rID].eth = _eth.add(round_[_rID].eth);
    
                // distribute eth
                _eventData_ = distributeExternal(_rID, _pID, _eth, _affID, _eventData_);
                _eventData_ = distributeInternal(_rID, _pID, _eth, _keys, _eventData_);
            
                // call end tx function to fire end tx event.
                endTx(_pID, _eth, _keys, _eventData_);
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
        public
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
        
        // grab our pot amount
        uint256 _pot = round_[_rID].pot;
        
        // calculate our winner share, community rewards, gen share, 
        // p3d share, and amount reserved for next pot 
        uint256 _win = (_pot.mul(50)) / 100;
        uint256 _gen = (_pot.mul(potSplit_gen)) / 100;
        uint256 _res = (_pot.sub(_win)).sub(_gen);
        
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
        
        // distribute gen portion to key holders
        round_[_rID].mask = _ppt.add(round_[_rID].mask);

        // prepare event data
        _eventData_.compressedData = _eventData_.compressedData + (round_[_rID].end * 1000000);
        _eventData_.compressedIDs = _eventData_.compressedIDs + (uint256(_winPID) * 100000000000000000000000000);
        _eventData_.winnerAddr = plyr_[_winPID].addr;
        _eventData_.amountWon = _win;
        _eventData_.genAmount = _gen;
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
        // distribute com share (2%)
        uint com = _eth.div(50);
        plyr_[comAddr].aff = com.add(plyr_[comAddr].aff);

        // distribute share to affiliate (20%)
        uint _aff = _eth.div(5);

        // one level above gets 50% of _aff
        // two levels above gets 50% of _aff
        uint256 _oneLevelAff = 0;
        uint256 _twoLevelAff = 0;

        address oneLevelAddr = address(0);
        address twoLevelAddr = address(0);

        // decide what to do with affiliate share of fees
        // affiliate must not be self, and must have a name registered
        if (_affID != _pID && _affID != address(0)) {

            // distribut to one level above
            _oneLevelAff = _aff.mul(5).div(10);
            oneLevelAddr = _affID;

            plyr_[oneLevelAddr].aff = _oneLevelAff.add(plyr_[oneLevelAddr].aff);
            _aff = _aff.sub(_oneLevelAff);

            twoLevelAddr = plyr_[oneLevelAddr].laff;
            
            if (twoLevelAddr != address(0)) {
                // two level above exists, distribute to two level above
                _twoLevelAff = _aff;

                plyr_[twoLevelAddr].aff = _twoLevelAff.add(plyr_[twoLevelAddr].aff);
                _aff = _aff.sub(_twoLevelAff);
            }
        }

        // if _aff > 0, transfer the remaining aff to comAddr
        plyr_[comAddr].aff = _aff.add(plyr_[comAddr].aff);

        emit onAffiliatePayout(twoLevelAddr, oneLevelAddr, _twoLevelAff, _oneLevelAff);
        return(_eventData_);
    }

    /**
     * @dev distributes eth based on fees to gen and pot
     */
    function distributeInternal(uint256 _rID, address _pID, uint256 _eth, uint256 _keys, F3Ddatasets.EventReturns memory _eventData_)
        private
        returns(F3Ddatasets.EventReturns)
    {
        // 78% is distributed internally, from which,
        // 53% to the pot
        // 25% to dividends

        // calculate gen share
        uint256 _gen = (_eth.mul(fees_gen)) / 100;
        
        _eth = _eth.sub(((_eth.mul(22)) / 100));
        
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
    function endTx(address _pID, uint256 _eth, uint256 _keys, F3Ddatasets.EventReturns memory _eventData_)
        private
    {
        _eventData_.compressedData = _eventData_.compressedData + (now * 1000000000000000000);
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
