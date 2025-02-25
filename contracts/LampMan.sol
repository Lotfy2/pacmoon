// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract LampMan {
    struct LampTransaction {
        uint256 timestamp;
        uint256 score;
        address player;
    }

    mapping(address => LampTransaction[]) public playerTransactions;
    mapping(address => uint256) public playerTotalScore;
    
    event LampCollected(
        address indexed player,
        uint256 score,
        uint256 timestamp
    );

    event NewHighScore(
        address indexed player,
        uint256 totalScore
    );

    function collectLamp() external {
        // Each lamp is worth 10 points
        uint256 score = 10;
        
        // Record the transaction
        LampTransaction memory newTx = LampTransaction({
            timestamp: block.timestamp,
            score: score,
            player: msg.sender
        });
        
        playerTransactions[msg.sender].push(newTx);
        playerTotalScore[msg.sender] += score;
        
        emit LampCollected(
            msg.sender,
            score,
            block.timestamp
        );
        
        if (playerTotalScore[msg.sender] > getHighScore()) {
            emit NewHighScore(msg.sender, playerTotalScore[msg.sender]);
        }
    }
    
    function getPlayerTransactions(address player) external view returns (LampTransaction[] memory) {
        return playerTransactions[player];
    }
    
    function getPlayerScore(address player) external view returns (uint256) {
        return playerTotalScore[player];
    }
    
    function getHighScore() public view returns (uint256) {
        return playerTotalScore[msg.sender];
    }
}