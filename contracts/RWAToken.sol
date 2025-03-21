// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import OpenZeppelin contracts for NFT functionality and access control
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RWAToken
 * @dev A smart contract for tokenizing Real World Assets (RWA) as NFTs
 * Inherits from ERC721URIStorage for NFT metadata storage and Ownable for access control
 */
contract RWAToken is ERC721URIStorage, Ownable {
    // Counter for generating unique token IDs
    uint256 private _tokenIdCounter;
    // Mapping to store additional asset data (if needed)
    mapping(uint256 => string) private _assetData;

    /**
     * @dev Structure to store detailed information about each tokenized asset
     * @param legalDocumentHash IPFS or other hash of the legal documentation
     * @param auditor Address of the entity that audited/verified the asset
     * @param valuation Current valuation of the asset in base currency
     * @param auditDate Timestamp when the asset was last audited
     */
    struct AssetInfo {
        string legalDocumentHash;
        address auditor;
        uint256 valuation;
        uint256 auditDate;
    }

    // Mapping from token ID to asset information
    mapping(uint256 => AssetInfo) public assetRegistry;

    /**
     * @dev Constructor initializes the ERC721 token with name and symbol
     * Also sets the contract owner using OpenZeppelin's Ownable
     */
    constructor(
    string memory name,
    string memory symbol
    ) 
        ERC721(name, symbol) 
        Ownable(msg.sender) // Explicit owner initialization
    {}

    /**
     * @dev Mints a new RWA token with associated metadata and asset information
     * @param to Address that will receive the minted token
     * @param metadataURI IPFS URI containing the token's metadata
     * @param legalDocHash Hash of legal documents associated with the asset
     * @param valuation Initial valuation of the asset
     * @return tokenId The ID of the newly minted token
     */
    function mintAsset(
        address to,
        string memory metadataURI,
        string memory legalDocHash,
        uint256 valuation
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);  // Now available via ERC721URIStorage
        
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
     * @dev Override of the tokenURI function from ERC721URIStorage
     * @param tokenId The ID of the token to query
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
     * @param tokenId The ID of the token to check
     * @return The address of the token owner
     */
    function verifyOwnership(uint256 tokenId) public view returns (address) {
        return ownerOf(tokenId);
    }

    /**
     * @dev Retrieves the detailed information about an asset
     * @param tokenId The ID of the token to query
     * @return AssetInfo struct containing the asset's details
     */
    function getAssetData(uint256 tokenId) public view returns (AssetInfo memory) {
        return assetRegistry[tokenId];
    }
}