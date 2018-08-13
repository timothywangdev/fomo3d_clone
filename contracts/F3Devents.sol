pragma solidity ^0.4.24;

contract F3Devents {
    // fired whenever a player registers a name
    event onNewName
        (
         uint256 indexed playerID,
         address indexed playerAddress,
         bytes32 indexed playerName,
         bool isNewPlayer,
         uint256 affiliateID,
         address affiliateAddress,
         bytes32 affiliateName,
         uint256 amountPaid,
         uint256 timeStamp
         );
    
    // fired at end of buy or reload
    event onEndTx
        (
         uint256 compressedData,     
         uint256 compressedIDs,      
         address playerAddress,
         uint256 ethIn,
         uint256 keysBought,
         address winnerAddr,
         bytes32 winnerName,
         uint256 amountWon,
         uint256 newPot,
         uint256 genAmount,
         uint256 potAmount
         );
    
    // fired whenever theres a withdraw
    event onWithdraw
        (
         address indexed playerID,
         uint256 ethOut,
         uint256 timeStamp
         );
    
    // fired whenever a withdraw forces end round to be ran
    event onWithdrawAndDistribute
        (
         address playerAddress,
         uint256 ethOut,
         uint256 compressedData,
         uint256 compressedIDs,
         address winnerAddr,
         uint256 amountWon,
         uint256 newPot,
         uint256 genAmount
         );
    
    // (fomo3d long only) fired whenever a player tries a buy after round timer 
    // hit zero, and causes end round to be ran.
    event onBuyAndDistribute
        (
         address playerAddress,
         uint256 ethIn,
         uint256 compressedData,
         uint256 compressedIDs,
         address winnerAddr,
         bytes32 winnerName,
         uint256 amountWon,
         uint256 newPot,
         uint256 genAmount
         );
    
    // (fomo3d long only) fired whenever a player tries a reload after round timer 
    // hit zero, and causes end round to be ran.
    event onReLoadAndDistribute
        (
         address playerAddress,
         uint256 compressedData,
         uint256 compressedIDs,
         address winnerAddr,
         bytes32 winnerName,
         uint256 amountWon,
         uint256 newPot,
         uint256 genAmount
         );
    
    // fired whenever an affiliate is paid
    event onAffiliatePayout
        (
         address indexed twoLevelAddr,
         address  indexed oneLevelAddr,
         uint256 twoLevelAmount,
         uint256 oneLevelAmount
         );
    
    // received pot swap deposit
    event onPotSwapDeposit
        (
         uint256 roundID,
         uint256 amountAddedToPot
         );
}
