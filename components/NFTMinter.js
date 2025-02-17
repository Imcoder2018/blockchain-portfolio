import { useState } from 'react';
import { Web3 } from 'web3';

export default function NFTMinter({ contract }) {
  const [auctionDays, setAuctionDays] = useState(7);
  const [startingPrice, setStartingPrice] = useState('');
  const [txStatus, setTxStatus] = useState('');

  const mintNFT = async () => {
    try {
      setTxStatus('Initializing transaction...');
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      
      setTxStatus('Setting up auction parameters...');
      const priceInWei = web3.utils.toWei(startingPrice, 'ether');
      
      setTxStatus('Sending mint transaction...');
      await contract.methods.mintWithAuction(
        auctionDays,
        priceInWei
      ).send({ from: accounts[0] });
      
      setTxStatus('Mint successful! Generating metadata...');
      // Additional logic for post-mint actions
      
    } catch (error) {
      console.error('Minting failed:', error);
      setTxStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Create NFT with Auction</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Auction Duration (days)
          </label>
          <select
            className="w-full p-2 border rounded"
            value={auctionDays}
            onChange={(e) => setAuctionDays(e.target.value)}
          >
            <option value={3}>3 Days</option>
            <option value={7}>7 Days</option>
            <option value={14}>14 Days</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Starting Price (ETH)
          </label>
          <input
            type="number"
            step="0.01"
            className="w-full p-2 border rounded"
            value={startingPrice}
            onChange={(e) => setStartingPrice(e.target.value)}
          />
        </div>

        <button
          onClick={mintNFT}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          disabled={!startingPrice}
        >
          Mint NFT with Auction
        </button>

        {txStatus && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
            {txStatus}
          </div>
        )}
      </div>
    </div>
  );
}
