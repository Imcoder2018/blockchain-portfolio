import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import PortfolioToken from '../artifacts/contracts/PortfolioToken.sol/PortfolioToken.json';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export default function StakingComponent({ tokenAddress }) {
    const [amount, setAmount] = useState('');
    const [balance, setBalance] = useState('0');
    const [stakedAmount, setStakedAmount] = useState('0');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        if (tokenAddress) {
            console.log('Token Address:', tokenAddress);
            loadBalances();
        }
    }, [tokenAddress]);

    function isValidAddress(address) {
        return ethers.utils.isAddress(address);
    }

    async function loadBalances(retry = 0) {
        if (typeof window.ethereum !== 'undefined' && tokenAddress) {
            try {
                console.log('Loading balances for address:', tokenAddress);
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const signerAddress = await signer.getAddress();
                console.log('Signer address:', signerAddress);

                const contract = new ethers.Contract(tokenAddress, PortfolioToken.abi, provider);
                console.log('Contract instance created');

                // Get token name and symbol to verify contract
                const name = await contract.name();
                const symbol = await contract.symbol();
                console.log('Token Name:', name);
                console.log('Token Symbol:', symbol);

                const balance = await contract.balanceOf(signerAddress);
                console.log('Balance:', balance.toString());
                const staked = await contract.getStakedBalance(signerAddress);
                console.log('Staked:', staked.toString());

                setBalance(ethers.utils.formatEther(balance));
                setStakedAmount(ethers.utils.formatEther(staked));
                setError('');
                setRetryCount(0);
            } catch (err) {
                console.error("Detailed error:", err);
                setError(`Error loading balances: ${err.message}`);
                setBalance('0');
                setStakedAmount('0');
                if (retry < MAX_RETRIES) {
                    setTimeout(() => {
                        setRetryCount(retry + 1);
                        loadBalances(retry + 1);
                    }, RETRY_DELAY);
                }
            }
        } else {
            setError('MetaMask not detected or token address not set');
        }
    }

    async function stakeTokens() {
        if (!amount) {
            setError('Please enter an amount to stake');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(tokenAddress, PortfolioToken.abi, signer);
            console.log('Attempting to stake:', amount, 'tokens');

            const amountToStake = ethers.utils.parseEther(amount);
            console.log('Amount in Wei:', amountToStake.toString());

            // Stake the tokens
            console.log('Staking tokens...');
            const stakeTx = await contract.stake(amountToStake);
            console.log('Stake transaction hash:', stakeTx.hash);
            await stakeTx.wait();
            console.log('Stake confirmed');
            
            // Refresh balances
            await loadBalances();
            setAmount('');
        } catch (err) {
            console.error("Detailed staking error:", err);
            setError(`Error staking tokens: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }

    async function unstakeTokens() {
        if (!stakedAmount || stakedAmount === '0') return;
        
        setLoading(true);
        setError('');
        
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(tokenAddress, PortfolioToken.abi, signer);

            const amountToUnstake = ethers.utils.parseEther(stakedAmount);
            const tx = await contract.unstake(amountToUnstake);
            await tx.wait();

            await loadBalances();
            setError('');
        } catch (err) {
            console.error("Error unstaking tokens:", err);
            setError(err.message || 'Error unstaking tokens. Please try again.');
        }
        setLoading(false);
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Token Staking</h2>
            
            {error && (
                <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <div className="mb-4">
                <p className="text-sm text-gray-600">Your Balance: {balance} PFT</p>
                <p className="text-sm text-gray-600">Staked Amount: {stakedAmount} PFT</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Amount to Stake</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>

                <button
                    onClick={stakeTokens}
                    disabled={loading || !amount}
                    className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                        ${loading || !amount 
                            ? 'bg-indigo-400 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                    {loading ? 'Processing...' : 'Stake Tokens'}
                </button>

                {stakedAmount !== '0' && (
                    <button
                        onClick={unstakeTokens}
                        disabled={loading}
                        className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                            ${loading ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                        {loading ? 'Processing...' : 'Unstake Tokens'}
                    </button>
                )}
            </div>
        </div>
    );
}
