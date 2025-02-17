const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Portfolio Contracts', function () {
  let owner, user;
  let token, nft, marketplace;

  before(async () => {
    [owner, user] = await ethers.getSigners();
    
    const Token = await ethers.getContractFactory('PortfolioToken');
    token = await Token.deploy();
    
    const NFT = await ethers.getContractFactory('PortfolioNFT');
    nft = await NFT.deploy('0x694AA1769357215DE4FAC081bf1f309aDC325306');
    
    const Marketplace = await ethers.getContractFactory('MultiTokenMarketplace');
    marketplace = await Marketplace.deploy();
  });

  describe('ERC20 Functionality', () => {
    it('Should mint initial supply to owner', async () => {
      expect(await token.balanceOf(owner.address)).to.equal(
        ethers.parseUnits('1000000', 18)
      );
    });

    it('Should handle staking correctly', async () => {
      await token.connect(owner).stake(ethers.parseUnits('100', 18));
      expect(await token.stakedBalances(owner.address)).to.equal(
        ethers.parseUnits('100', 18)
      );
    });
  });

  describe('NFT Auction System', () => {
    it('Should create auction on mint', async () => {
      await nft.connect(owner).mintWithAuction(7, ethers.parseEther('1'));
      const auction = await nft.auctions(0);
      expect(auction.startPrice).to.equal(ethers.parseEther('1'));
    });
  });

  describe('Marketplace', () => {
    it('Should list ERC721 item', async () => {
      await nft.connect(owner).approve(marketplace.target, 0);
      await marketplace.connect(owner).listItem(
        nft.target,
        1, // ERC721 enum value
        0,
        1,
        ethers.parseEther('2')
      );
      
      const listing = await marketplace.listings(0);
      expect(listing.price).to.equal(ethers.parseEther('2'));
    });
  });
});
