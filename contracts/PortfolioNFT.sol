// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PortfolioNFT is ERC721, Ownable {
    uint256 private _tokenIds;
    mapping(uint256 => uint256) public tokenPrices;
    mapping(uint256 => string) private _tokenURIs;
    
    constructor() ERC721("Portfolio NFT", "PNFT") Ownable(msg.sender) {
        _tokenIds = 0;
    }
    
    function mintNFT(address recipient, string memory tokenURI, uint256 price) 
        public 
        returns (uint256) 
    {
        _tokenIds += 1;
        uint256 newItemId = _tokenIds;
        
        _mint(recipient, newItemId);
        _tokenURIs[newItemId] = tokenURI;
        tokenPrices[newItemId] = price;
        
        return newItemId;
    }
    
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "PortfolioNFT: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }
    
    function getPrice(uint256 tokenId) public view returns (uint256) {
        require(_exists(tokenId), "PortfolioNFT: Query for nonexistent token");
        return tokenPrices[tokenId];
    }
    
    function setPrice(uint256 tokenId, uint256 newPrice) public {
        require(_exists(tokenId), "PortfolioNFT: Query for nonexistent token");
        require(ownerOf(tokenId) == msg.sender, "PortfolioNFT: Only owner can set price");
        tokenPrices[tokenId] = newPrice;
    }
    
    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId > 0 && tokenId <= _tokenIds;
    }
}
