const hre = require("hardhat");
const fs = require('fs');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy PortfolioToken with initial supply
  const initialSupply = hre.ethers.utils.parseEther("1000000"); // 1 million tokens
  const PortfolioToken = await hre.ethers.getContractFactory("PortfolioToken");
  const token = await PortfolioToken.deploy(initialSupply);
  await token.deployed();
  console.log("PortfolioToken deployed to:", token.address);

  // Deploy PortfolioNFT
  const PortfolioNFT = await hre.ethers.getContractFactory("PortfolioNFT");
  const nft = await PortfolioNFT.deploy();
  await nft.deployed();
  console.log("PortfolioNFT deployed to:", nft.address);

  // Deploy Staking Contract
  const Staking = await hre.ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(token.address);
  await staking.deployed();
  console.log("Staking contract deployed to:", staking.address);

  // Deploy NFTAuction
  const NFTAuction = await hre.ethers.getContractFactory("NFTAuction");
  const auction = await NFTAuction.deploy(nft.address);
  await auction.deployed();
  console.log("NFTAuction deployed to:", auction.address);

  // Deploy MultiTokenMarketplace
  const MultiTokenMarketplace = await hre.ethers.getContractFactory("MultiTokenMarketplace");
  const marketplace = await MultiTokenMarketplace.deploy();
  await marketplace.deployed();
  console.log("MultiTokenMarketplace deployed to:", marketplace.address);

  // Save contract addresses
  const addresses = {
    token: token.address,
    nft: nft.address,
    staking: staking.address,
    auction: auction.address,
    marketplace: marketplace.address
  };

  fs.writeFileSync(
    'contract-addresses.json',
    JSON.stringify(addresses, null, 2)
  );
  console.log("Contract addresses saved to contract-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
