// contracts/Marketplace.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import OpenZeppelin's ERC721 interface for NFT functionality
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title RWAMarketplace
 * @dev A marketplace contract for trading Real World Asset (RWA) tokens
 * Provides functionality for listing, buying, and managing tokenized assets
 */
contract RWAMarketplace {
    /**
     * @dev Structure to store information about a listed asset
     * @param seller Address of the asset seller
     * @param price Listed price in wei
     * @param isActive Whether the listing is currently active
     * @param priceInUSD Price in USD at the time of listing
     */
    struct Listing {
        address seller;
        uint256 price;
        bool isActive;
        uint256 priceInUSD;
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
    constructor(address _tokenAddress, uint256 _feePercentage, address _priceFeedAddress) {
        rwaToken = IERC721(_tokenAddress);
        feePercentage = _feePercentage;
        if (_priceFeedAddress != address(0)) {
            priceFeed = AggregatorV3Interface(_priceFeedAddress);
        }
    }

    // Function to update the staleness threshold (can be restricted to owner if needed)
    function updateStalePriceThreshold(uint256 _newThreshold) external {
        stalePriceThreshold = _newThreshold;
        emit StalePriceThresholdUpdated(_newThreshold);
    }

    // Get latest ETH/USD price
    function getLatestEthPrice() public view returns (int) {
        // Get the latest round data including timestamp
        (
            uint80 roundId,
            int price,
            /* uint startedAt */,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        
        // Ensure the price is positive
        require(price > 0, "Negative or zero price");
        
        // Check for stale data
        require(block.timestamp - updatedAt <= stalePriceThreshold, 
            "Price feed data is stale. Oracle update required.");
        
        // Additional checks for data integrity
        require(answeredInRound >= roundId, "Price data is from an older round");
        
        return price; // Price with 8 decimals
    }

    // Convert ETH amount to USD
    function ethToUSD(uint256 ethAmount) public view returns (uint256) {
        int ethPrice = getLatestEthPrice();
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
            isActive: true,
            priceInUSD: ethToUSD(price)
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
    function buyAsset(uint256 tokenId) external payable {
        Listing storage listing = listings[tokenId];
        require(listing.isActive, "Not for sale");
        
        // Convert USD price to current ETH equivalent
        int ethPrice = getLatestEthPrice();
        require(ethPrice > 0, "Invalid ETH price");
        
        // Calculate required ETH amount: (USD price * 1e18) / (ETH price in USD * 1e8)
        uint256 requiredEthAmount = (listing.priceInUSD * 1e18) / uint256(ethPrice);
        require(msg.value >= requiredEthAmount, "Insufficient funds");
        
        // Log approval status
        bool isApproved = rwaToken.getApproved(tokenId) == address(this);
        bool isApprovedForAll = rwaToken.isApprovedForAll(listing.seller, address(this));
        emit ApprovalStatus(tokenId, listing.seller, isApproved, isApprovedForAll);
        
        require(isApproved || isApprovedForAll, "Marketplace not approved");

        // Deactivate the listing first to prevent reentrancy
        listing.isActive = false;

        // Calculate platform fee and seller proceeds based on actual ETH received
        uint256 actualPayment = requiredEthAmount; // Use the required amount, not the listing price
        uint256 fee = (actualPayment * feePercentage) / 100;
        uint256 sellerProceeds = actualPayment - fee;
        emit PaymentCalculated(actualPayment, fee, sellerProceeds);

        // Log transfer attempt
        emit TransferAttempt(tokenId, listing.seller, msg.sender, actualPayment);
        
        // Transfer NFT to buyer first
        try rwaToken.transferFrom(listing.seller, msg.sender, tokenId) {
            // Transfer funds to seller
            payable(listing.seller).transfer(sellerProceeds);
            emit PaymentTransferred(listing.seller, sellerProceeds);

            // Refund excess payment to buyer if any
            uint256 excess = msg.value - actualPayment;
            if (excess > 0) {
                payable(msg.sender).transfer(excess);
            }

            emit AssetSold(tokenId, msg.sender, actualPayment);
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
