const { ethers } = require("hardhat");
const addresses = {
  token: "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0",
  nft: "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
  staking: "0x9A676e781A523b5d0C0e43731313A708CB607508",
  auction: "0x0B306BF915C4d645ff596e518fAf3F9669b97016",
  marketplace: "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1"
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // Get contract instances
  const Token = await ethers.getContractFactory("PortfolioToken");
  const token = await Token.attach(addresses.token);

  // 1. Check initial balances
  const balance = await token.balanceOf(deployer.address);
  console.log("\nInitial balances:");
  console.log("Token balance:", ethers.utils.formatEther(balance));

  // 2. Approve tokens for staking
  const amountToStake = ethers.utils.parseEther("100");
  console.log("\nApproving tokens...");
  const approveTx = await token.approve(addresses.staking, amountToStake);
  await approveTx.wait();
  console.log("Tokens approved");

  // 3. Check allowance
  const allowance = await token.allowance(deployer.address, addresses.staking);
  console.log("Allowance:", ethers.utils.formatEther(allowance));

  // 4. Stake tokens
  const Staking = await ethers.getContractFactory("Staking");
  const staking = await Staking.attach(addresses.staking);
  
  console.log("\nStaking tokens...");
  const stakeTx = await staking.stake(amountToStake);
  await stakeTx.wait();
  console.log("Tokens staked successfully");

  // 5. Check final balances
  const finalBalance = await token.balanceOf(deployer.address);
  const stakedBalance = await staking.getStakedBalance(deployer.address);
  const stakingTimestamp = await staking.getStakingTimestamp(deployer.address);
  
  console.log("\nFinal balances:");
  console.log("Token balance:", ethers.utils.formatEther(finalBalance));
  console.log("Staked balance:", ethers.utils.formatEther(stakedBalance));
  console.log("Staking timestamp:", new Date(stakingTimestamp * 1000).toLocaleString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
