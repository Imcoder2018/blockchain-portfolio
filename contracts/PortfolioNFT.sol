// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PortfolioNFT is ERC721, Ownable {
    uint256 public _tokenIds;
    mapping(uint256 => uint256) public tokenPrices;
    mapping(uint256 => string) private _tokenURIs;
    
    constructor() ERC721("Portfolio NFT", "PNFT") Ownable() {
        _tokenIds = 0;
    }
    
    function mintNFT(string memory uri, uint256 price) 
        public 
        returns (uint256) 
    {
        _tokenIds += 1;
        uint256 newItemId = _tokenIds;
        
        _safeMint(msg.sender, newItemId);
        _tokenURIs[newItemId] = uri;
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
    
    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }
}
