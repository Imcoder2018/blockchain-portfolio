const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Minting tokens with account:", deployer.address);

  const PortfolioToken = await ethers.getContractFactory("PortfolioToken");
  const token = await PortfolioToken.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

  // Mint 1,000,000 tokens to the deployer
  const mintAmount = 1000000;
  const tx = await token.mint(deployer.address, mintAmount);
  await tx.wait();

  console.log(`Minted ${mintAmount} tokens to ${deployer.address}`);

  // Get balance
  const balance = await token.balanceOf(deployer.address);
  console.log("Balance:", ethers.utils.formatEther(balance));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
