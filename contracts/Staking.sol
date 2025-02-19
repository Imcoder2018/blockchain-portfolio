// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Staking is ReentrancyGuard, Ownable {
    IERC20 public stakingToken;
    mapping(address => uint256) private _stakedBalances;
    mapping(address => uint256) private _stakingTimestamp;

    event TokensStaked(address indexed user, uint256 amount);
    event TokensUnstaked(address indexed user, uint256 amount);

    constructor(address _stakingToken) Ownable() {
        require(_stakingToken != address(0), "Invalid token address");
        stakingToken = IERC20(_stakingToken);
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(stakingToken.balanceOf(msg.sender) >= amount, "Insufficient balance");

        bool success = stakingToken.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");

        _stakedBalances[msg.sender] += amount;
        _stakingTimestamp[msg.sender] = block.timestamp;

        emit TokensStaked(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(_stakedBalances[msg.sender] >= amount, "Not enough staked tokens");

        _stakedBalances[msg.sender] -= amount;

        bool success = stakingToken.transfer(msg.sender, amount);
        require(success, "Transfer failed");

        emit TokensUnstaked(msg.sender, amount);
    }

    function getStakedBalance(address account) external view returns (uint256) {
        return _stakedBalances[account];
    }

    function getStakingTimestamp(address account) external view returns (uint256) {
        return _stakingTimestamp[account];
    }
}
