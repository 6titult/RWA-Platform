// contracts/Marketplace.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import OpenZeppelin's ERC721 interface for NFT functionality
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

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

    /**
     * @dev Events emitted when assets are listed or sold
     */
    event AssetListed(uint256 tokenId, address seller, uint256 price);
    event AssetSold(uint256 tokenId, address buyer, uint256 price);
    event ApprovalStatus(uint256 tokenId, address seller, bool isApproved, bool isApprovedForAll);
    event TransferAttempt(uint256 tokenId, address from, address to, uint256 price);
    event PaymentCalculated(uint256 price, uint256 fee, uint256 sellerProceeds);
    event PaymentTransferred(address seller, uint256 amount);

    /**
     * @dev Constructor initializes the marketplace with token contract and fee
     * @param _tokenAddress Address of the RWA token contract
     * @param _feePercentage Platform fee percentage (e.g., 2 for 2%)
     */
    constructor(address _tokenAddress, uint256 _feePercentage) {
        rwaToken = IERC721(_tokenAddress);
        feePercentage = _feePercentage;
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
    function buyAsset(uint256 tokenId) external payable {
        Listing storage listing = listings[tokenId];
        require(listing.isActive, "Not for sale");
        require(msg.value >= listing.price, "Insufficient funds");
        
        // Log approval status
        bool isApproved = rwaToken.getApproved(tokenId) == address(this);
        bool isApprovedForAll = rwaToken.isApprovedForAll(listing.seller, address(this));
        emit ApprovalStatus(tokenId, listing.seller, isApproved, isApprovedForAll);
        
        require(isApproved || isApprovedForAll, "Marketplace not approved");

        // Deactivate the listing first to prevent reentrancy
        listing.isActive = false;

        // Calculate platform fee and seller proceeds
        uint256 fee = (listing.price * feePercentage) / 100;
        uint256 sellerProceeds = listing.price - fee;
        emit PaymentCalculated(listing.price, fee, sellerProceeds);

        // Log transfer attempt
        emit TransferAttempt(tokenId, listing.seller, msg.sender, listing.price);
        
        // Transfer NFT to buyer first
        try rwaToken.transferFrom(listing.seller, msg.sender, tokenId) {
            // Transfer funds to seller
            payable(listing.seller).transfer(sellerProceeds);
            emit PaymentTransferred(listing.seller, sellerProceeds);

            // Refund excess payment to buyer if any
            uint256 excess = msg.value - listing.price;
            if (excess > 0) {
                payable(msg.sender).transfer(excess);
            }

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
