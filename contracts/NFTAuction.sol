// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTAuction is ReentrancyGuard, Ownable {
    struct Auction {
        address seller;
        uint256 tokenId;
        uint256 startPrice;
        uint256 currentPrice;
        uint256 endTime;
        address highestBidder;
        bool active;
        bool ended;
    }

    IERC721 public nft;
    mapping(uint256 => Auction) public auctions;
    mapping(address => mapping(uint256 => uint256)) public bids;
    uint256 public minAuctionDuration = 1 hours;
    uint256 public maxAuctionDuration = 7 days;

    event AuctionCreated(uint256 tokenId, uint256 startPrice, uint256 endTime);
    event BidPlaced(uint256 tokenId, address bidder, uint256 amount);
    event AuctionEnded(uint256 tokenId, address winner, uint256 amount);
    event AuctionCancelled(uint256 tokenId);

    constructor(address _nft) Ownable() {
        nft = IERC721(_nft);
    }

    function createAuction(
        uint256 tokenId,
        uint256 startPrice,
        uint256 duration
    ) external {
        require(
            duration >= minAuctionDuration && duration <= maxAuctionDuration,
            "Invalid auction duration"
        );
        require(
            nft.ownerOf(tokenId) == msg.sender,
            "Only token owner can create auction"
        );
        require(
            nft.getApproved(tokenId) == address(this),
            "Auction not approved"
        );
        require(
            !auctions[tokenId].active,
            "Auction already exists"
        );

        auctions[tokenId] = Auction({
            seller: msg.sender,
            tokenId: tokenId,
            startPrice: startPrice,
            currentPrice: startPrice,
            endTime: block.timestamp + duration,
            highestBidder: address(0),
            active: true,
            ended: false
        });

        nft.transferFrom(msg.sender, address(this), tokenId);
        emit AuctionCreated(tokenId, startPrice, block.timestamp + duration);
    }

    function placeBid(uint256 tokenId) external payable nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(auction.active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.value > auction.currentPrice, "Bid too low");

        address previousBidder = auction.highestBidder;
        uint256 previousBid = auction.currentPrice;

        // Refund previous bidder
        if (previousBidder != address(0)) {
            payable(previousBidder).transfer(previousBid);
        }

        auction.highestBidder = msg.sender;
        auction.currentPrice = msg.value;
        bids[msg.sender][tokenId] = msg.value;

        emit BidPlaced(tokenId, msg.sender, msg.value);
    }

    function endAuction(uint256 tokenId) external nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(auction.active, "Auction not active");
        require(
            block.timestamp >= auction.endTime || msg.sender == auction.seller,
            "Cannot end auction yet"
        );

        auction.active = false;
        auction.ended = true;

        if (auction.highestBidder != address(0)) {
            // Transfer NFT to winner
            nft.transferFrom(address(this), auction.highestBidder, tokenId);
            // Transfer funds to seller
            payable(auction.seller).transfer(auction.currentPrice);
            emit AuctionEnded(tokenId, auction.highestBidder, auction.currentPrice);
        } else {
            // Return NFT to seller if no bids
            nft.transferFrom(address(this), auction.seller, tokenId);
            emit AuctionCancelled(tokenId);
        }
    }

    function getAuction(uint256 tokenId) external view returns (
        address seller,
        uint256 startPrice,
        uint256 currentPrice,
        uint256 endTime,
        address highestBidder,
        bool active,
        bool ended
    ) {
        Auction storage auction = auctions[tokenId];
        return (
            auction.seller,
            auction.startPrice,
            auction.currentPrice,
            auction.endTime,
            auction.highestBidder,
            auction.active,
            auction.ended
        );
    }

    function updateAuctionDurations(uint256 _minDuration, uint256 _maxDuration) external onlyOwner {
        require(_minDuration < _maxDuration, "Invalid durations");
        minAuctionDuration = _minDuration;
        maxAuctionDuration = _maxDuration;
    }
}
