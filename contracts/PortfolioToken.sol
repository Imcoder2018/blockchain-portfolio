// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PortfolioToken is ERC20, Ownable {
    mapping(address => uint256) public stakedBalances;
    mapping(address => uint256) public stakingTimestamp;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);

    constructor() 
        ERC20("Portfolio Token", "PFT")
        Ownable(msg.sender)
    {
        // Mint initial supply to deployer
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function stake(uint256 amount) external {
        require(amount > 0, "Cannot stake 0 tokens");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Transfer tokens from sender to contract
        bool success = transfer(address(this), amount);
        require(success, "Transfer failed");
        
        stakedBalances[msg.sender] += amount;
        stakingTimestamp[msg.sender] = block.timestamp;

        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external {
        require(amount > 0, "Cannot unstake 0 tokens");
        require(stakedBalances[msg.sender] >= amount, "Insufficient staked balance");
        require(block.timestamp >= stakingTimestamp[msg.sender] + 1 days, "Staking period not complete");

        stakedBalances[msg.sender] -= amount;
        require(transfer(msg.sender, amount), "Transfer failed");

        emit Unstaked(msg.sender, amount);
    }

    function getStakedBalance(address account) external view returns (uint256) {
        return stakedBalances[account];
    }

    function getStakingTimestamp(address account) external view returns (uint256) {
        return stakingTimestamp[account];
    }
}
