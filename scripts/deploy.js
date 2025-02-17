const hre = require("hardhat");

async function main() {
  // Get the contract factories
  const PortfolioToken = await hre.ethers.getContractFactory("PortfolioToken");
  const PortfolioNFT = await hre.ethers.getContractFactory("PortfolioNFT");
  const MultiTokenMarketplace = await hre.ethers.getContractFactory("MultiTokenMarketplace");

  console.log("Deploying contracts...");

  // Deploy PortfolioToken
  const portfolioToken = await PortfolioToken.deploy();
  await portfolioToken.deployed();
  console.log("PortfolioToken deployed to:", portfolioToken.address);

  // Deploy PortfolioNFT
  const portfolioNFT = await PortfolioNFT.deploy();
  await portfolioNFT.deployed();
  console.log("PortfolioNFT deployed to:", portfolioNFT.address);

  // Deploy MultiTokenMarketplace
  const marketplace = await MultiTokenMarketplace.deploy();
  await marketplace.deployed();
  console.log("MultiTokenMarketplace deployed to:", marketplace.address);

  // Write the addresses to a file
  const fs = require("fs");
  const addresses = {
    PortfolioToken: portfolioToken.address,
    PortfolioNFT: portfolioNFT.address,
    MultiTokenMarketplace: marketplace.address
  };

  fs.writeFileSync(
    "contract-addresses.json",
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
