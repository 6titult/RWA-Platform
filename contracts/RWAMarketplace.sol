// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract RWAMarketplace is ReentrancyGuard, Ownable {
    /**
     * @dev Structure to store information about a listed asset
     * @param seller Address of the asset seller
     * @param price Listed price in wei (ETH)
     * @param isActive Whether the listing is currently active
     */
    struct Listing {
        address seller;
        uint256 price;
        bool isActive;
    }

    // Interface for the RWA token contract
    IERC721 public rwaToken;
    // Mapping from token ID to listing information
    mapping(uint256 => Listing) public listings;
    // Platform fee percentage (e.g., 2 for 2%)
    uint256 public feePercentage;
    // Chainlink price feed interface
    AggregatorV3Interface internal priceFeed;
    // Staleness threshold for price data (default: 24 hours)
    uint256 public stalePriceThreshold = 86400; // 24 hours in seconds

    /**
     * @dev Events emitted when assets are listed or sold
     */
    event AssetListed(uint256 tokenId, address seller, uint256 price);
    event AssetSold(uint256 tokenId, address buyer, uint256 price);
    event ApprovalStatus(uint256 tokenId, address seller, bool isApproved, bool isApprovedForAll);
    event TransferAttempt(uint256 tokenId, address from, address to, uint256 price);
    event PaymentCalculated(uint256 price, uint256 fee, uint256 sellerProceeds);
    event PaymentTransferred(address seller, uint256 amount);
    event StalePriceThresholdUpdated(uint256 newThreshold);

    /**
     * @dev Constructor initializes the marketplace with token contract and fee
     * @param _tokenAddress Address of the RWA token contract
     * @param _feePercentage Platform fee percentage (e.g., 2 for 2%)
     * @param _priceFeedAddress Address of the Chainlink ETH/USD price feed contract
     */
    constructor(address _tokenAddress, uint256 _feePercentage, address _priceFeedAddress) Ownable(msg.sender) {
        rwaToken = IERC721(_tokenAddress);
        feePercentage = _feePercentage;
        if (_priceFeedAddress != address(0)) {
            priceFeed = AggregatorV3Interface(_priceFeedAddress);
        }
    }

    // Function to update the staleness threshold (can be restricted to owner if needed)
    function updateStalePriceThreshold(uint256 _newThreshold) external onlyOwner {
        stalePriceThreshold = _newThreshold;
        emit StalePriceThresholdUpdated(_newThreshold);
    }

    // Get latest ETH/USD price (for frontend display purposes only)
    function getLatestEthPrice() public view returns (int256) {
        (
            ,
            int256 price,
            ,
            uint256 updatedAt,
            
        ) = priceFeed.latestRoundData();
        
        require(price > 0, "Invalid price feed data");
        require(block.timestamp - updatedAt <= stalePriceThreshold, "Price feed data is stale");
        
        return price;
    }

    // Convert ETH amount to USD (for frontend display purposes only)
    function ethToUSD(uint256 ethAmount) public view returns (uint256) {
        int256 ethPrice = getLatestEthPrice();
        require(ethPrice > 0, "Invalid price");
        // Calculation: (ETH amount * price) / 1e18 [adjust decimals]
        return (ethAmount * uint256(ethPrice)) / 1e10; // 1e26 / 1e8 = 1e18
    }

    /**
     * @dev Lists an RWA token for sale
     * @param tokenId ID of the token to list
     * @param price Listing price in wei
     * Requirements:
     * - Caller must be the owner of the token
     * - Price must be greater than 0
     */
    function listAsset(uint256 tokenId, uint256 price) external {
        require(rwaToken.ownerOf(tokenId) == msg.sender, "Not owner");
        require(price > 0, "Invalid price");
        
        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            isActive: true
        });

        emit AssetListed(tokenId, msg.sender, price);
    }

    /**
     * @dev Allows a user to purchase a listed asset
     * @param tokenId ID of the token to purchase
     * Requirements:
     * - Listing must be active
     * - Sent value must be >= listing price
     * - Marketplace must have approval to transfer the token
     * Effects:
     * - Transfers the token to the buyer
     * - Sends funds to the seller (minus platform fee)
     * - Deactivates the listing
     */
    function buyAsset(uint256 tokenId) external payable nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.isActive, "Not for sale");

        // Check that the buyer sent enough ETH to cover the listing price
        require(msg.value >= listing.price, "Insufficient funds");
        
        // Log approval status
        bool isApproved = rwaToken.getApproved(tokenId) == address(this);
        bool isApprovedForAll = rwaToken.isApprovedForAll(listing.seller, address(this));
        emit ApprovalStatus(tokenId, listing.seller, isApproved, isApprovedForAll);
        
        require(isApproved || isApprovedForAll, "Marketplace not approved");

        // Deactivate the listing first to prevent reentrancy
        listing.isActive = false;

        // Calculate platform fee and seller proceeds based on listing price
        uint256 actualPayment = listing.price;
        uint256 fee = (actualPayment * feePercentage) / 100;
        uint256 sellerProceeds = actualPayment - fee;
        emit PaymentCalculated(actualPayment, fee, sellerProceeds);

        // Log transfer attempt
        emit TransferAttempt(tokenId, listing.seller, msg.sender, actualPayment);

        // Transfer NFT to buyer first
        try rwaToken.transferFrom(listing.seller, msg.sender, tokenId) {
            // Transfer payment to seller after state changes
            (bool success, ) = listing.seller.call{value: sellerProceeds}("");
            require(success, "Transfer to seller failed");

            // Refund excess payment to buyer if they sent more than required
            uint256 excess = msg.value - actualPayment;
            if (excess > 0) {
                (bool refundSuccess, ) = msg.sender.call{value: excess}("");
                require(refundSuccess, "Refund to buyer failed");
            }

            emit PaymentTransferred(listing.seller, sellerProceeds);
            emit AssetSold(tokenId, msg.sender, listing.price);
        } catch Error(string memory reason) {
            // Revert with the caught error
            listing.isActive = true; // Reactivate listing if transfer fails
            revert(string(abi.encodePacked("Transfer failed: ", reason)));
        }
    }

    /**
     * @dev Removes a listing when a token is burned
     * This function should be called when a token is burned to clean up the marketplace
     * 
     * @param tokenId The ID of the token that was burned
     */
    function removeBurnedListing(uint256 tokenId) external {
        require(address(rwaToken) != address(0), "Token contract not set");
        
        // Try to get the token owner - this will revert if the token is burned
        try rwaToken.ownerOf(tokenId) returns (address) {
            revert("Token still exists");
        } catch {
            // Token doesn't exist (was burned), so we can safely remove the listing
            delete listings[tokenId];
        }
    }
}
