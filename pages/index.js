import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import StakingComponent from '../components/StakingComponent';

export default function Home() {
  const [walletAddress, setWalletAddress] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [error, setError] = useState('');
  
  useEffect(() => {
    checkWalletConnection();
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  function handleAccountsChanged(accounts) {
    if (accounts.length > 0) {
      setWalletAddress(accounts[0]);
      setError('');
    } else {
      setWalletAddress('');
      setError('Please connect your wallet');
    }
  }

  async function checkWalletConnection() {
    try {
      if (!window.ethereum) {
        setError('Please install MetaMask!');
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        // This is the deployed token contract address
        setTokenAddress('0xa513E6E4b8f2a923D98304ec87F64353C4D5C853');
        
        // Check if we're on the correct network (Hardhat)
        const network = await provider.getNetwork();
        if (network.chainId !== 31337) {
          setError('Please connect to Hardhat Network (Chain ID: 31337)');
        }
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

      setError('');
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      // Check network
      const network = await provider.getNetwork();
      if (network.chainId !== 31337) {
        // Try to switch to Hardhat network
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x7A69' }], // 31337 in hex
          });
        } catch (switchError) {
          // If the network doesn't exist, add it
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x7A69',
                  chainName: 'Hardhat Network',
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: ['http://127.0.0.1:8545']
                }]
              });
            } catch (addError) {
              setError('Could not add Hardhat network');
              return;
            }
          } else {
            setError('Could not switch to Hardhat network');
            return;
          }
        }
      }

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setTokenAddress('0xa513E6E4b8f2a923D98304ec87F64353C4D5C853');
      }
    } catch (err) {
      console.error("Error connecting wallet:", err);
      setError('Failed to connect wallet');
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Blockchain Portfolio</h1>
          <div>
            {error && <p className="text-red-500 text-sm mr-4">{error}</p>}
            <button
              onClick={connectWallet}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              {walletAddress ? 
                `${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}` : 
                'Connect Wallet'}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Staking Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Token Management</h2>
            {!walletAddress ? (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-4">Please connect your wallet to start staking</p>
                <button
                  onClick={connectWallet}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                >
                  Connect Wallet
                </button>
              </div>
            ) : !tokenAddress ? (
              <div className="text-center py-4">
                <p className="text-gray-600">Loading token information...</p>
              </div>
            ) : (
              <StakingComponent tokenAddress={tokenAddress} />
            )}
          </div>

          {/* NFT Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">NFT Collection</h2>
            <div className="grid grid-cols-2 gap-4">
              {[1,2,3].map((nft) => (
                <div key={nft} className="border p-3 rounded-lg hover:bg-gray-50">
                  <div className="h-32 bg-gray-200 rounded mb-2"/>
                  <p className="text-sm">NFT #{nft}</p>
                  <p className="text-xs text-gray-500">Auction ending in --</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Marketplace Section */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Marketplace</h2>
          <div className="space-y-3">
            <div className="border-b pb-2">
              <p className="text-sm">ERC20 Listings: --</p>
              <p className="text-sm">NFT Listings: --</p>
            </div>
            <button className="w-full bg-purple-100 text-purple-800 p-2 rounded">
              Create New Listing
            </button>
          </div>
        </div>

        {/* Chainlink Integration Section */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Chainlink Services</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Price Feeds</h3>
              <p className="text-sm">ETH/USD: $--</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">VRF Requests</h3>
              <p className="text-sm">Pending: --</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
