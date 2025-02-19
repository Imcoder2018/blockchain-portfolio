import { useState } from 'react';
import { ethers } from 'ethers';
import addresses from '../contract-addresses.json';

export default function MintPage() {
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    async function mintNFT() {
        try {
            setStatus('');
            setLoading(true);

            if (!window.ethereum) {
                throw new Error('Please install MetaMask to use this feature');
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            
            console.log('Connected to wallet');
            console.log('NFT Contract address:', addresses.nft);

            // Use minimal ABI with only the functions we need
            const nftContract = new ethers.Contract(
                addresses.nft,
                [
                    "function mintNFT(string memory uri, uint256 price) public returns (uint256)",
                    "function _tokenIds() public view returns (uint256)",
                    "function ownerOf(uint256 tokenId) public view returns (address)",
                    "function tokenURI(uint256 tokenId) public view returns (string memory)"
                ],
                signer
            );

            setStatus('Creating metadata...');
            const metadata = {
                name: "Test NFT",
                description: "A test NFT",
                image: "https://via.placeholder.com/400?text=TestNFT",
                attributes: [
                    {
                        trait_type: "Price",
                        value: "0.1"
                    }
                ]
            };

            // Convert to base64
            const metadataString = JSON.stringify(metadata);
            const metadataBase64 = Buffer.from(metadataString).toString('base64');
            const uri = `data:application/json;base64,${metadataBase64}`;
            
            console.log('Minting NFT with metadata:', metadata);
            
            const price = ethers.utils.parseEther("0.1");
            
            // Get current gas price and increase it by 20%
            const gasPrice = await provider.getGasPrice();
            const adjustedGasPrice = gasPrice.mul(120).div(100);
            
            // Use a fixed gas limit that we know works
            const gasLimit = 500000;
            
            setStatus('Sending transaction...');
            console.log('Transaction parameters:', {
                gasLimit,
                gasPrice: adjustedGasPrice.toString()
            });
            
            const tx = await nftContract.mintNFT(uri, price, {
                gasLimit,
                gasPrice: adjustedGasPrice
            });
            
            setStatus('Transaction sent! Waiting for confirmation...');
            console.log('Transaction hash:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('Transaction confirmed!');
            console.log('Gas used:', receipt.gasUsed.toString());

            // Get the new token ID
            const totalSupply = await nftContract._tokenIds();
            const tokenId = totalSupply.toString();
            
            // Verify the NFT
            const owner = await nftContract.ownerOf(tokenId);
            const tokenURI = await nftContract.tokenURI(tokenId);

            setStatus(`NFT minted successfully! Token ID: ${tokenId}`);
            console.log('NFT details:', {
                tokenId,
                owner,
                tokenURI
            });

        } catch (err) {
            console.error('Error:', err);
            setStatus(`Error: ${err.message || 'Unknown error occurred'}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Mint NFT</h1>
            
            <button
                onClick={mintNFT}
                disabled={loading}
                className={`
                    px-4 py-2 rounded
                    ${loading 
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600'
                    }
                    text-white font-bold
                `}
            >
                {loading ? 'Minting...' : 'Mint NFT'}
            </button>

            {status && (
                <div className="mt-4 p-4 rounded border">
                    {status}
                </div>
            )}
        </div>
    );
}
