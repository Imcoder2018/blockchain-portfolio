const hre = require("hardhat");
const fs = require('fs');

async function main() {
  try {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Interacting with contracts using account:", deployer.address);

    // Deploy contracts
    console.log("\nDeploying contracts...");
    
    // Deploy token
    const PortfolioToken = await hre.ethers.getContractFactory("PortfolioToken");
    const token = await PortfolioToken.deploy(1000000); // 1M tokens
    await token.deployed();
    console.log("Token deployed to:", token.address);
    
    // Deploy NFT
    const PortfolioNFT = await hre.ethers.getContractFactory("PortfolioNFT");
    const nft = await PortfolioNFT.deploy();
    await nft.deployed();
    console.log("NFT deployed to:", nft.address);

    // Save addresses
    const addresses = {
      token: token.address,
      nft: nft.address
    };
    fs.writeFileSync('contract-addresses.json', JSON.stringify(addresses, null, 2));
    console.log("Contract addresses saved");

    // 1. Mint NFTs
    console.log("\n1. Minting NFTs...");
    for (let i = 1; i <= 3; i++) {
      const uri = `https://ipfs.io/ipfs/QmTgqnhFBMkfT9s8PHKcdXBn1f5bG3Q5hmBaR4U6hoTvb${i}`;
      const price = hre.ethers.utils.parseEther((0.1 * i).toString());
      const tx = await nft.mintNFT(deployer.address, uri, price);
      await tx.wait();
      console.log(`Minted NFT #${i} with price ${hre.ethers.utils.formatEther(price)} ETH`);
    }

    // 2. Check token balance
    const initialBalance = await token.balanceOf(deployer.address);
    console.log("\n2. Initial token balance:", hre.ethers.utils.formatEther(initialBalance), "PFLIO");

    // 3. Stake tokens
    console.log("\n3. Staking tokens...");
    const stakeAmount = hre.ethers.utils.parseEther("1000");
    const stakeTx = await token.stakeTokens(stakeAmount);
    await stakeTx.wait();
    console.log("Staked", hre.ethers.utils.formatEther(stakeAmount), "tokens");

    // 4. Check final balances
    const finalBalance = await token.balanceOf(deployer.address);
    const stakedBalance = await token.getStakedBalance(deployer.address);
    const stakingTime = await token.getStakingTimestamp(deployer.address);
    
    console.log("\n4. Final balances:");
    console.log("- Wallet balance:", hre.ethers.utils.formatEther(finalBalance), "PFLIO");
    console.log("- Staked balance:", hre.ethers.utils.formatEther(stakedBalance), "PFLIO");
    console.log("- Stake timestamp:", new Date(stakingTime * 1000).toLocaleString());

    // 5. List all NFTs
    console.log("\n5. NFT Collection:");
    for (let i = 1; i <= 3; i++) {
      const exists = await nft.exists(i);
      if (exists) {
        const owner = await nft.ownerOf(i);
        const price = await nft.getPrice(i);
        const uri = await nft.tokenURI(i);
        console.log(`NFT #${i}:`);
        console.log(`- Owner: ${owner}`);
        console.log(`- Price: ${hre.ethers.utils.formatEther(price)} ETH`);
        console.log(`- URI: ${uri}`);
      }
    }

    console.log("\nAll operations completed successfully!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
