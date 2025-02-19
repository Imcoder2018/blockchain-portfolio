// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PortfolioToken is ERC20, Ownable {
    mapping(address => uint256) private _stakedBalances;
    mapping(address => uint256) private _stakingTimestamp;

    event TokensStaked(address indexed user, uint256 amount);
    event TokensUnstaked(address indexed user, uint256 amount);

    constructor(uint256 initialSupply) ERC20("Portfolio Token", "PFT") Ownable() {
        _mint(msg.sender, initialSupply * (10 ** decimals()));
    }

    function stakeTokens(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Check allowance
        uint256 currentAllowance = allowance(msg.sender, address(this));
        require(currentAllowance >= amount, "Please approve tokens first");

        // Transfer tokens to contract
        bool success = transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");
        
        // Update staking info
        _stakedBalances[msg.sender] += amount;
        _stakingTimestamp[msg.sender] = block.timestamp;
        
        emit TokensStaked(msg.sender, amount);
    }

    function unstakeTokens(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(_stakedBalances[msg.sender] >= amount, "Not enough staked tokens");

        // Update staking info
        _stakedBalances[msg.sender] -= amount;

        // Transfer tokens back
        bool success = transfer(msg.sender, amount);
        require(success, "Transfer failed");
        
        emit TokensUnstaked(msg.sender, amount);
    }

    function getStakedBalance(address account) external view returns (uint256) {
        return _stakedBalances[account];
    }

    function getStakingTimestamp(address account) external view returns (uint256) {
        return _stakingTimestamp[account];
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
