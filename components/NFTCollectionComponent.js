import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import PortfolioNFT from '../artifacts/contracts/PortfolioNFT.sol/PortfolioNFT.json';
import NFTAuction from '../artifacts/contracts/NFTAuction.sol/NFTAuction.json';
import addresses from '../contract-addresses.json';

export default function NFTCollectionComponent() {
    const [nfts, setNfts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAuctionModal, setShowAuctionModal] = useState(false);
    const [selectedNft, setSelectedNft] = useState(null);
    const [auctionForm, setAuctionForm] = useState({
        startPrice: '',
        duration: '24'
    });

    useEffect(() => {
        loadNFTs();
    }, []);

    async function loadNFTs() {
        try {
            setError('');
            setLoading(true);
            console.log('Starting to load NFTs...');

            if (!window.ethereum) {
                throw new Error('Please install MetaMask to use this feature');
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            
            const signer = provider.getSigner();
            const userAddress = await signer.getAddress();
            console.log('Connected with address:', userAddress);

            console.log('Contract addresses:', addresses);
            console.log('NFT Contract address:', addresses.nft);
            
            const nftContract = new ethers.Contract(
                addresses.nft,
                PortfolioNFT.abi,
                signer
            );

            const auctionContract = new ethers.Contract(
                addresses.auction,
                NFTAuction.abi,
                signer
            );

            // Get total supply
            const totalSupply = await nftContract._tokenIds();
            console.log('Total NFTs minted:', totalSupply.toString());

            const nftData = [];
            
            // Load each NFT
            for (let i = 1; i <= totalSupply; i++) {
                try {
                    // Check if NFT exists
                    const exists = await nftContract.exists(i);
                    console.log(`NFT ${i} exists:`, exists);
                    
                    if (!exists) {
                        console.log(`NFT ${i} does not exist, skipping`);
                        continue;
                    }

                    // Get NFT owner
                    const owner = await nftContract.ownerOf(i);
                    console.log(`NFT ${i} owner:`, owner);
                    
                    // Only load NFTs owned by the user
                    if (owner.toLowerCase() !== userAddress.toLowerCase()) {
                        console.log(`NFT ${i} not owned by user, skipping`);
                        continue;
                    }

                    // Get NFT metadata
                    const uri = await nftContract.tokenURI(i);
                    const price = await nftContract.getPrice(i);
                    
                    console.log(`NFT ${i} data:`, {
                        tokenId: i,
                        owner,
                        uri,
                        price: ethers.utils.formatEther(price)
                    });

                    // Get auction data
                    const auction = await auctionContract.auctions(i);
                    const isAuctionActive = auction.endTime.gt(Math.floor(Date.now() / 1000));

                    // Parse metadata
                    let metadata = {
                        name: `NFT #${i}`,
                        description: 'Portfolio NFT',
                        image: 'https://via.placeholder.com/400?text=NFT'
                    };

                    try {
                        if (uri.startsWith('data:application/json;base64,')) {
                            const base64Data = uri.split(',')[1];
                            const jsonString = atob(base64Data);
                            metadata = JSON.parse(jsonString);
                            console.log(`NFT ${i} metadata:`, metadata);
                        }
                    } catch (err) {
                        console.warn(`Error parsing metadata for NFT ${i}:`, err);
                    }

                    nftData.push({
                        id: i,
                        name: metadata.name,
                        description: metadata.description,
                        image: metadata.image,
                        price: ethers.utils.formatEther(price),
                        owner,
                        isOwner: true, // We already filtered for owned NFTs
                        auction: {
                            ...auction,
                            startPrice: ethers.utils.formatEther(auction.startPrice),
                            currentBid: ethers.utils.formatEther(auction.currentBid),
                            endTime: auction.endTime.toNumber(),
                            isActive: isAuctionActive
                        }
                    });
                    
                    console.log(`Successfully loaded NFT ${i}`);
                } catch (err) {
                    console.error(`Error loading NFT ${i}:`, err);
                }
            }

            console.log('Loaded NFTs:', nftData);
            setNfts(nftData);
            setLoading(false);
            
            if (nftData.length === 0) {
                setError('You don\'t own any NFTs yet. Mint some first!');
            }
        } catch (err) {
            console.error('Error in loadNFTs:', err);
            setError(err.message || 'Error loading NFTs');
            setLoading(false);
        }
    }

    async function createAuction(e) {
        e.preventDefault();
        try {
            setError('');
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            const auctionContract = new ethers.Contract(
                addresses.auction,
                NFTAuction.abi,
                signer
            );

            const tx = await auctionContract.createAuction(
                selectedNft.id,
                ethers.utils.parseEther(auctionForm.startPrice),
                auctionForm.duration * 3600,
                { gasLimit: 500000 }
            );

            await tx.wait();
            setShowAuctionModal(false);
            loadNFTs();

        } catch (err) {
            console.error('Auction creation failed:', err);
            setError('Failed to create auction. Please check your inputs and try again.');
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">NFT Collection</h2>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading NFTs...</p>
                </div>
            ) : nfts.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-600">No NFTs found. Mint some first!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {nfts.map(nft => (
                        <div key={nft.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                            <img
                                src={nft.image}
                                alt={nft.name}
                                className="w-full h-48 object-cover"
                            />
                            <div className="p-4">
                                <h3 className="text-lg font-semibold text-gray-800">{nft.name}</h3>
                                <p className="text-gray-600 mt-1">{nft.description}</p>
                                <p className="text-gray-600 mt-2">Price: {nft.price} ETH</p>
                                <p className="text-sm text-gray-500">Owner: {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}</p>
                                
                                {nft.auction.isActive && (
                                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-blue-600">
                                            Auction: {nft.auction.currentBid || nft.auction.startPrice} ETH
                                        </p>
                                        <p className="text-xs text-blue-500 mt-1">
                                            Ends in {formatTimeLeft(nft.auction.endTime)}
                                        </p>
                                    </div>
                                )}

                                {nft.isOwner && !nft.auction.isActive && (
                                    <button
                                        onClick={() => {
                                            setSelectedNft(nft);
                                            setShowAuctionModal(true);
                                        }}
                                        className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
                                    >
                                        Create Auction
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showAuctionModal && selectedNft && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Create Auction for {selectedNft.name}</h3>
                        <form onSubmit={createAuction}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Starting Price (ETH)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={auctionForm.startPrice}
                                        onChange={(e) => setAuctionForm({...auctionForm, startPrice: e.target.value})}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Duration (hours)
                                    </label>
                                    <select
                                        value={auctionForm.duration}
                                        onChange={(e) => setAuctionForm({...auctionForm, duration: e.target.value})}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    >
                                        <option value="24">24 hours</option>
                                        <option value="48">48 hours</option>
                                        <option value="72">72 hours</option>
                                    </select>
                                </div>
                                <div className="flex space-x-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAuctionModal(false)}
                                        className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
                                    >
                                        Create Auction
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function formatTimeLeft(endTime) {
    if (!endTime) return 'No active auction';
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = endTime - now;
    
    if (timeLeft <= 0) return 'Auction ended';
    
    const days = Math.floor(timeLeft / 86400);
    const hours = Math.floor((timeLeft % 86400) / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
}
