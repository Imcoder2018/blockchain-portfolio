import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import StakingComponent from '../components/StakingComponent';
import MarketplaceComponent from '../components/MarketplaceComponent';
import NFTCollectionComponent from '../components/NFTCollectionComponent';
import addresses from '../contract-addresses.json';

export default function Home() {
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('staking');

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  async function checkIfWalletIsConnected() {
    try {
      if (!window.ethereum) {
        setError('Please install MetaMask!');
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send("eth_accounts", []);
      
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setError('');
      } else {
        setError('Please connect your wallet');
      }
    } catch (err) {
      console.error("Error checking wallet connection:", err);
      setError('Error connecting to wallet');
    }
  }

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        setError('Please install MetaMask!');
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setWalletAddress(accounts[0]);
      setError('');
    } catch (err) {
      console.error("Error connecting wallet:", err);
      setError('Error connecting wallet');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-600 mb-4">
            Blockchain Portfolio Platform
          </h1>
          
          {!walletAddress ? (
            <button
              onClick={connectWallet}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="text-sm text-gray-600">
              Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex justify-center space-x-8">
              <button
                onClick={() => setActiveTab('staking')}
                className={`${
                  activeTab === 'staking'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Staking
              </button>
              <button
                onClick={() => setActiveTab('nft')}
                className={`${
                  activeTab === 'nft'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                NFT Collection
              </button>
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`${
                  activeTab === 'marketplace'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Marketplace
              </button>
              <a
                href="/mint"
                className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Mint NFT
              </a>
            </nav>
          </div>
        </div>

        <div className="mt-8">
          {activeTab === 'staking' && (
            <StakingComponent tokenAddress={addresses.token} />
          )}
          {activeTab === 'nft' && (
            <NFTCollectionComponent nftAddress={addresses.nft} />
          )}
          {activeTab === 'marketplace' && (
            <MarketplaceComponent 
              marketplaceAddress={addresses.marketplace}
              nftAddress={addresses.nft}
              tokenAddress={addresses.token}
            />
          )}
        </div>
      </div>
    </div>
  );
}
