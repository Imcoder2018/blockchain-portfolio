const hre = require("hardhat");
const fs = require('fs');

async function main() {
    try {
        // Deploy a new NFT contract for testing
        const PortfolioNFT = await hre.ethers.getContractFactory("PortfolioNFT");
        const nft = await PortfolioNFT.deploy();
        await nft.deployed();
        console.log("NFT contract deployed to:", nft.address);

        // Mint a single NFT
        const metadata = {
            name: "Test NFT #1",
            description: "A test NFT",
            image: "https://via.placeholder.com/400?text=TestNFT",
            attributes: [
                {
                    trait_type: "Price",
                    value: "0.1"
                }
            ]
        };

        const metadataString = JSON.stringify(metadata);
        const metadataBase64 = Buffer.from(metadataString).toString('base64');
        const uri = `data:application/json;base64,${metadataBase64}`;
        
        console.log("Minting NFT with metadata:", metadata);
        
        const price = hre.ethers.utils.parseEther("0.1");
        const tx = await nft.mintNFT(uri, price);
        const receipt = await tx.wait();
        
        console.log("NFT minted successfully!");
        console.log("Transaction hash:", tx.hash);
        console.log("Gas used:", receipt.gasUsed.toString());
        
        // Verify the NFT
        const totalSupply = await nft._tokenIds();
        console.log("Total supply:", totalSupply.toString());
        
        const owner = await nft.ownerOf(1);
        console.log("NFT owner:", owner);
        
        const tokenURI = await nft.tokenURI(1);
        console.log("Token URI:", tokenURI);
        
    } catch (err) {
        console.error("Error:", err);
        if (err.error) {
            console.error("Error details:", err.error);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
