// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import OpenZeppelin contracts for NFT functionality and access control
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RWAToken
 * @dev A smart contract for tokenizing Real World Assets (RWA) as NFTs
 * This contract allows for the creation and management of tokenized real-world assets,
 * such as real estate, commodities, or financial instruments.
 * 
 * Key features:
 * - ERC721 standard implementation for NFT functionality
 * - URI storage for metadata
 * - Access control for administrative functions
 * - Asset registry for storing detailed asset information
 * 
 * @notice This contract inherits from:
 * - ERC721URIStorage: Provides NFT functionality with URI storage
 * - Ownable: Provides access control for administrative functions
 */
contract RWAToken is ERC721URIStorage, Ownable {
    // Counter for generating unique token IDs
    // Increments each time a new token is minted
    uint256 private _tokenIdCounter;

    // Mapping to store additional asset data
    // This is a legacy mapping that can be used for storing extra data if needed
    mapping(uint256 => string) private _assetData;

    /**
     * @dev Structure to store detailed information about each tokenized asset
     * This structure contains all the metadata and verification data for a real-world asset
     * 
     * @param legalDocumentHash - Hash of the legal documents proving ownership and rights
     * @param auditor - Address of the entity that verified the asset's authenticity
     * @param valuation - Current market value of the asset in base currency (wei)
     * @param auditDate - Timestamp of the most recent audit/verification
     */
    struct AssetInfo {
        string legalDocumentHash;
        address auditor;
        uint256 valuation;
        uint256 auditDate;
    }

    // Mapping from token ID to asset information
    // Stores the complete asset information for each tokenized asset
    mapping(uint256 => AssetInfo) public assetRegistry;

    /**
     * @dev Constructor initializes the ERC721 token with name and symbol
     * Sets up the basic NFT parameters and initializes the contract owner
     * 
     * @param name - The name of the token (e.g., "Real World Asset Token")
     * @param symbol - The symbol of the token (e.g., "RWAT")
     */
    constructor(
        string memory name,
        string memory symbol
    ) 
        ERC721(name, symbol) 
        Ownable(msg.sender) // Explicit owner initialization for OpenZeppelin v5
    {}

    /**
     * @dev Mints a new RWA token with associated metadata and asset information
     * This function can only be called by the contract owner
     * 
     * @param to - Address that will receive the minted token
     * @param metadataURI - IPFS URI containing the token's metadata (JSON)
     * @param legalDocHash - Hash of legal documents associated with the asset
     * @param valuation - Initial valuation of the asset in base currency
     * @return tokenId - The ID of the newly minted token
     * 
     * @notice The function:
     * 1. Generates a new unique token ID
     * 2. Mints the token to the specified address
     * 3. Sets the token's metadata URI
     * 4. Stores the asset information in the registry
     */
    function mintAsset(
        address to,
        string memory metadataURI,
        string memory legalDocHash,
        uint256 valuation
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        // Store the asset information in the registry
        assetRegistry[tokenId] = AssetInfo({
            legalDocumentHash: legalDocHash,
            auditor: msg.sender,
            valuation: valuation,
            auditDate: block.timestamp
        });

        return tokenId;
    }

    /**
     * @dev Returns the current token ID counter
     * This can be used to determine the total number of tokens minted
     * 
     * @return The current value of the token ID counter
     */
    function getTokenIdCounter() public view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Override of the tokenURI function from ERC721URIStorage
     * Returns the URI containing the token's metadata
     * 
     * @param tokenId - The ID of the token to query
     * @return The URI containing the token's metadata
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Verifies the current owner of a token
     * This is a convenience function that wraps the ERC721 ownerOf function
     * 
     * @param tokenId - The ID of the token to check
     * @return The address of the token owner
     */
    function verifyOwnership(uint256 tokenId) public view returns (address) {
        return ownerOf(tokenId);
    }

    /**
     * @dev Retrieves the detailed information about an asset
     * Returns the complete AssetInfo struct for a given token ID
     * 
     * @param tokenId - The ID of the token to query
     * @return AssetInfo struct containing the asset's details
     */
    function getAssetData(uint256 tokenId) public view returns (AssetInfo memory) {
        return assetRegistry[tokenId];
    }
}