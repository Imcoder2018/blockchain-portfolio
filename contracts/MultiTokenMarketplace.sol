// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC1155/IERC1155.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract MultiTokenMarketplace is Ownable {
    enum TokenStandard { ERC20, ERC721, ERC1155 }

    struct Listing {
        address tokenAddress;
        TokenStandard standard;
        uint256 tokenId;
        uint256 amount;
        uint256 price;
        address seller;
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    uint256 public nextListingId;

    event ItemListed(
        uint256 listingId,
        address indexed seller,
        TokenStandard standard,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount,
        uint256 price
    );

    constructor() Ownable() {}

    function listItem(
        address _tokenAddress,
        TokenStandard _standard,
        uint256 _tokenId,
        uint256 _amount,
        uint256 _price
    ) external {
        require(_price > 0, 'Price must be greater than 0');

        if (_standard == TokenStandard.ERC721) {
            IERC721(_tokenAddress).transferFrom(msg.sender, address(this), _tokenId);
        } else if (_standard == TokenStandard.ERC1155) {
            IERC1155(_tokenAddress).safeTransferFrom(msg.sender, address(this), _tokenId, _amount, '');
        } else {
            IERC20(_tokenAddress).transferFrom(msg.sender, address(this), _amount);
        }

        listings[nextListingId] = Listing({
            tokenAddress: _tokenAddress,
            standard: _standard,
            tokenId: _tokenId,
            amount: _amount,
            price: _price,
            seller: msg.sender,
            active: true
        });

        emit ItemListed(
            nextListingId,
            msg.sender,
            _standard,
            _tokenAddress,
            _tokenId,
            _amount,
            _price
        );

        nextListingId++;
    }

    function buyItem(uint256 _listingId) external payable {
        Listing storage listing = listings[_listingId];
        require(listing.active, 'Listing not active');
        require(msg.value == listing.price, 'Incorrect price');

        listing.active = false;

        if (listing.standard == TokenStandard.ERC721) {
            IERC721(listing.tokenAddress).transferFrom(address(this), msg.sender, listing.tokenId);
        } else if (listing.standard == TokenStandard.ERC1155) {
            IERC1155(listing.tokenAddress).safeTransferFrom(address(this), msg.sender, listing.tokenId, listing.amount, '');
        } else {
            IERC20(listing.tokenAddress).transfer(msg.sender, listing.amount);
        }

        payable(listing.seller).transfer(msg.value);
    }
}
