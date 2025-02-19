const hre = require("hardhat");

async function main() {
  try {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Testing with account:", deployer.address);

    // Deploy token
    const PortfolioToken = await hre.ethers.getContractFactory("PortfolioToken");
    const token = await PortfolioToken.deploy(1000000); // 1M tokens
    await token.deployed();
    console.log("Token deployed to:", token.address);

    // Check initial balance
    const initialBalance = await token.balanceOf(deployer.address);
    console.log("Initial balance:", hre.ethers.utils.formatEther(initialBalance));

    // Stake tokens
    const stakeAmount = hre.ethers.utils.parseEther("1000");
    console.log("Staking tokens...");
    const stakeTx = await token.stakeTokens(stakeAmount);
    await stakeTx.wait();
    console.log("Tokens staked");

    // Check balances after staking
    const newBalance = await token.balanceOf(deployer.address);
    const stakedBalance = await token.getStakedBalance(deployer.address);
    console.log("New wallet balance:", hre.ethers.utils.formatEther(newBalance));
    console.log("Staked balance:", hre.ethers.utils.formatEther(stakedBalance));

    // Get staking timestamp
    const stakingTime = await token.getStakingTimestamp(deployer.address);
    console.log("Stake timestamp:", new Date(stakingTime * 1000).toLocaleString());

  } catch (error) {
    console.error("Error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
