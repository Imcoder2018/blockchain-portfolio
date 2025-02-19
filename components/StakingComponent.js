import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import addresses from '../contract-addresses.json';

export default function StakingComponent({ tokenAddress }) {
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [stakedBalance, setStakedBalance] = useState('0');
    const [tokenBalance, setTokenBalance] = useState('0');
    const [amountToStake, setAmountToStake] = useState('');

    useEffect(() => {
        if (window.ethereum) {
            updateBalances();
        }
    }, [tokenAddress]);

    async function updateBalances() {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const userAddress = await signer.getAddress();

            // Initialize contracts with explicit ABI
            const tokenContract = new ethers.Contract(
                tokenAddress,
                [
                    "function balanceOf(address account) view returns (uint256)",
                    "function decimals() view returns (uint8)",
                    "function approve(address spender, uint256 amount) returns (bool)",
                    "function allowance(address owner, address spender) view returns (uint256)"
                ],
                signer
            );

            const stakingContract = new ethers.Contract(
                addresses.staking,
                [
                    "function getStakedBalance(address account) view returns (uint256)"
                ],
                signer
            );

            const balance = await tokenContract.balanceOf(userAddress);
            const staked = await stakingContract.getStakedBalance(userAddress);
            const decimals = await tokenContract.decimals();

            setTokenBalance(ethers.utils.formatUnits(balance, decimals));
            setStakedBalance(ethers.utils.formatUnits(staked, decimals));
            setError('');
        } catch (err) {
            console.error('Error updating balances:', err);
            setError('Failed to update balances: ' + err.message);
        }
    }

    async function approveTokens(amount) {
        try {
            setStatus('Checking allowance...');
            setError('');
            
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            console.log('Token address:', tokenAddress);
            console.log('Staking address:', addresses.staking);

            const tokenContract = new ethers.Contract(
                tokenAddress,
                [
                    "function approve(address spender, uint256 amount) returns (bool)",
                    "function allowance(address owner, address spender) view returns (uint256)"
                ],
                signer
            );

            const userAddress = await signer.getAddress();
            console.log('User address:', userAddress);

            // Check current allowance
            const currentAllowance = await tokenContract.allowance(userAddress, addresses.staking);
            console.log('Current allowance:', currentAllowance.toString());

            if (currentAllowance.gte(amount)) {
                console.log('Sufficient allowance exists');
                setStatus('Already approved');
                return true;
            }

            setStatus('Approving tokens...');
            
            // Get current gas price and increase by 20%
            const gasPrice = await provider.getGasPrice();
            const adjustedGasPrice = gasPrice.mul(120).div(100);
            
            console.log('Sending approve transaction...');
            console.log('Amount to approve:', amount.toString());
            console.log('Gas price:', adjustedGasPrice.toString());

            const tx = await tokenContract.approve(addresses.staking, amount, {
                gasLimit: 100000,
                gasPrice: adjustedGasPrice
            });

            setStatus('Waiting for approval confirmation...');
            console.log('Approval transaction hash:', tx.hash);

            await tx.wait();
            
            // Verify the new allowance
            const newAllowance = await tokenContract.allowance(userAddress, addresses.staking);
            console.log('New allowance:', newAllowance.toString());

            if (newAllowance.lt(amount)) {
                throw new Error('Approval failed - allowance not set correctly');
            }

            setStatus('Tokens approved successfully');
            return true;
        } catch (err) {
            console.error('Approval error:', err);
            setError('Failed to approve tokens: ' + err.message);
            throw err;
        }
    }

    async function handleStake(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            if (!amountToStake || parseFloat(amountToStake) <= 0) {
                throw new Error('Please enter a valid amount to stake');
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            const amount = ethers.utils.parseEther(amountToStake);
            
            // First approve tokens
            await approveTokens(amount);
            
            // Then stake tokens using the correct function name
            const stakingContract = new ethers.Contract(
                addresses.staking,
                [
                    "function stake(uint256 amount) external",
                    "function getStakedBalance(address account) external view returns (uint256)"
                ],
                signer
            );

            setStatus('Staking tokens...');
            console.log('Staking amount:', amount.toString());
            
            const tx = await stakingContract.stake(amount, {
                gasLimit: 200000,
                gasPrice: (await provider.getGasPrice()).mul(120).div(100)
            });

            setStatus('Waiting for staking confirmation...');
            console.log('Staking transaction hash:', tx.hash);
            
            await tx.wait();
            
            setStatus('Tokens staked successfully');
            setAmountToStake('');
            
            // Update balances
            await updateBalances();
            
        } catch (err) {
            console.error('Staking error:', err);
            setError('Failed to stake tokens: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Stake Your Tokens</h2>
            
            <div className="mb-4">
                <p className="text-sm text-gray-600">Token Balance: {tokenBalance}</p>
                <p className="text-sm text-gray-600">Staked Balance: {stakedBalance}</p>
            </div>

            <form onSubmit={handleStake} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Amount to Stake
                    </label>
                    <input
                        type="number"
                        value={amountToStake}
                        onChange={(e) => setAmountToStake(e.target.value)}
                        placeholder="Enter amount"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    }`}
                >
                    {loading ? 'Processing...' : 'Stake Tokens'}
                </button>
            </form>

            {status && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">{status}</p>
                </div>
            )}

            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}
        </div>
    );
}
