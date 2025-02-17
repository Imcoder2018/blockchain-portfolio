const hre = require("hardhat");

async function main() {
    // Get the contract factory
    const PortfolioToken = await hre.ethers.getContractFactory("PortfolioToken");
    
    // Get the deployed contract instance
    const token = PortfolioToken.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");
    
    // Get contract information
    const name = await token.name();
    const symbol = await token.symbol();
    const decimals = await token.decimals();
    
    console.log("Token Information:");
    console.log("Name:", name);
    console.log("Symbol:", symbol);
    console.log("Decimals:", decimals.toString());
    
    // Get the deployer's address (first account)
    const [deployer] = await hre.ethers.getSigners();
    console.log("\nDeployer address:", deployer.address);
    
    // Check deployer's balance
    const balance = await token.balanceOf(deployer.address);
    console.log("Deployer balance:", hre.ethers.utils.formatEther(balance), "PFT");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
