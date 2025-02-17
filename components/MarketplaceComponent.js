import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import MultiTokenMarketplace from '../artifacts/contracts/MultiTokenMarketplace.sol/MultiTokenMarketplace.json';
import PortfolioToken from '../artifacts/contracts/PortfolioToken.sol/PortfolioToken.json';
import PortfolioNFT from '../artifacts/contracts/PortfolioNFT.sol/PortfolioNFT.json';

export default function MarketplaceComponent({ marketplaceAddress, tokenAddress, nftAddress }) {
    const [listings, setListings] = useState({ erc20: [], nft: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [ethPrice, setEthPrice] = useState(0);
    const [newListing, setNewListing] = useState({
        type: 'ERC20',
        amount: '',
        price: '',
        tokenId: ''
    });

    useEffect(() => {
        if (marketplaceAddress) {
            loadListings();
            fetchEthPrice();
        }
        // Fetch ETH price every 60 seconds
        const interval = setInterval(fetchEthPrice, 60000);
        return () => clearInterval(interval);
    }, [marketplaceAddress]);

    async function fetchEthPrice() {
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
            const data = await response.json();
            setEthPrice(data.ethereum.usd);
        } catch (err) {
            console.error('Error fetching ETH price:', err);
        }
    }

    function formatUsdPrice(ethAmount) {
        if (!ethPrice || !ethAmount) return '$ --';
        const usdAmount = parseFloat(ethAmount) * ethPrice;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(usdAmount);
    }

    async function loadListings() {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const marketplace = new ethers.Contract(marketplaceAddress, MultiTokenMarketplace.abi, provider);
            
            const totalListings = await marketplace.nextListingId();
            const erc20Listings = [];
            const nftListings = [];

            for (let i = 0; i < totalListings; i++) {
                const listing = await marketplace.listings(i);
                if (listing.active) {
                    if (listing.standard === 0) { // ERC20
                        erc20Listings.push({
                            id: i,
                            amount: ethers.utils.formatEther(listing.amount),
                            price: ethers.utils.formatEther(listing.price),
                            seller: listing.seller
                        });
                    } else if (listing.standard === 1) { // ERC721
                        nftListings.push({
                            id: i,
                            tokenId: listing.tokenId.toString(),
                            price: ethers.utils.formatEther(listing.price),
                            seller: listing.seller
                        });
                    }
                }
            }

            setListings({ erc20: erc20Listings, nft: nftListings });
            setError('');
        } catch (err) {
            console.error('Error loading listings:', err);
            setError('Error loading listings. Please try again.');
        }
    }

    async function createListing() {
        setLoading(true);
        setError('');

        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const marketplace = new ethers.Contract(marketplaceAddress, MultiTokenMarketplace.abi, signer);

            let tokenContract;
            let standard;
            let tokenId = 0;
            let amount;

            if (newListing.type === 'ERC20') {
                tokenContract = new ethers.Contract(tokenAddress, PortfolioToken.abi, signer);
                standard = 0; // ERC20
                amount = ethers.utils.parseEther(newListing.amount);
                
                // Approve marketplace to spend tokens
                const approveTx = await tokenContract.approve(marketplaceAddress, amount);
                await approveTx.wait();
            } else {
                tokenContract = new ethers.Contract(nftAddress, PortfolioNFT.abi, signer);
                standard = 1; // ERC721
                tokenId = newListing.tokenId;
                amount = 1;
                
                // Approve marketplace to transfer NFT
                const approveTx = await tokenContract.approve(marketplaceAddress, tokenId);
                await approveTx.wait();
            }

            const price = ethers.utils.parseEther(newListing.price);
            
            const tx = await marketplace.listItem(
                newListing.type === 'ERC20' ? tokenAddress : nftAddress,
                standard,
                tokenId,
                amount,
                price
            );
            await tx.wait();

            // Refresh listings
            await loadListings();
            setShowCreateModal(false);
            setNewListing({ type: 'ERC20', amount: '', price: '', tokenId: '' });
        } catch (err) {
            console.error('Error creating listing:', err);
            setError('Error creating listing: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    async function buyItem(listingId, price) {
        setLoading(true);
        setError('');

        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const marketplace = new ethers.Contract(marketplaceAddress, MultiTokenMarketplace.abi, signer);

            const tx = await marketplace.buyItem(listingId, {
                value: ethers.utils.parseEther(price)
            });
            await tx.wait();

            await loadListings();
        } catch (err) {
            console.error('Error buying item:', err);
            setError('Error buying item: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Marketplace</h2>
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                        1 ETH = {ethPrice ? `$${ethPrice.toLocaleString()}` : '$ --'}
                    </span>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        Create New Listing
                    </button>
                </div>
            </div>

            {/* ERC20 Listings */}
            <div>
                <h3 className="text-lg font-medium mb-4">ERC20 Listings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listings.erc20.map(listing => (
                        <div key={listing.id} className="p-4 border rounded-lg shadow-sm">
                            <p>Amount: {listing.amount} PFT</p>
                            <div className="flex flex-col space-y-1">
                                <p>Price: {listing.price} ETH</p>
                                <p className="text-sm text-gray-600">
                                    ({formatUsdPrice(listing.price)})
                                </p>
                            </div>
                            <p>Seller: {listing.seller.slice(0,6)}...{listing.seller.slice(-4)}</p>
                            <button
                                onClick={() => buyItem(listing.id, listing.price)}
                                className="mt-2 w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                disabled={loading}
                            >
                                Buy
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* NFT Listings */}
            <div>
                <h3 className="text-lg font-medium mb-4">NFT Listings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listings.nft.map(listing => (
                        <div key={listing.id} className="p-4 border rounded-lg shadow-sm">
                            <p>Token ID: {listing.tokenId}</p>
                            <div className="flex flex-col space-y-1">
                                <p>Price: {listing.price} ETH</p>
                                <p className="text-sm text-gray-600">
                                    ({formatUsdPrice(listing.price)})
                                </p>
                            </div>
                            <p>Seller: {listing.seller.slice(0,6)}...{listing.seller.slice(-4)}</p>
                            <button
                                onClick={() => buyItem(listing.id, listing.price)}
                                className="mt-2 w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                disabled={loading}
                            >
                                Buy
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create Listing Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h3 className="text-lg font-medium mb-4">Create New Listing</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select
                                    value={newListing.type}
                                    onChange={(e) => setNewListing({...newListing, type: e.target.value})}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                >
                                    <option value="ERC20">ERC20 Token</option>
                                    <option value="NFT">NFT</option>
                                </select>
                            </div>

                            {newListing.type === 'ERC20' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                                    <input
                                        type="number"
                                        value={newListing.amount}
                                        onChange={(e) => setNewListing({...newListing, amount: e.target.value})}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        placeholder="Amount of tokens"
                                    />
                                </div>
                            )}

                            {newListing.type === 'NFT' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Token ID</label>
                                    <input
                                        type="number"
                                        value={newListing.tokenId}
                                        onChange={(e) => setNewListing({...newListing, tokenId: e.target.value})}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        placeholder="NFT Token ID"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Price (ETH)</label>
                                <input
                                    type="number"
                                    value={newListing.price}
                                    onChange={(e) => setNewListing({...newListing, price: e.target.value})}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    placeholder="Price in ETH"
                                />
                                {newListing.price && (
                                    <p className="mt-1 text-sm text-gray-600">
                                        ≈ {formatUsdPrice(newListing.price)}
                                    </p>
                                )}
                            </div>

                            <div className="flex space-x-4">
                                <button
                                    onClick={createListing}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                >
                                    {loading ? 'Creating...' : 'Create'}
                                </button>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="mt-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && !showCreateModal && (
                <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
                    {error}
                </div>
            )}
        </div>
    );
}
