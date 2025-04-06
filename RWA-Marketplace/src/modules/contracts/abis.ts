export const tokenABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function getTokenIdCounter() view returns (uint256)',
  'function getAssetData(uint256) view returns (uint256,address,uint256,uint256)',
  'function mintAsset(address,string,string,uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function ownerOf(uint256) view returns (address)',
  'function getAssetData(uint256) view returns (string, address, uint256, uint256)',
  'function tokenURI(uint256) view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function approve(address to, uint256 tokenId)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  'function getApproved(uint256) view returns (address)',
  'function setApprovalForAll(address operator, bool approved)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)'
];

export const marketplaceABI = [
  'function listAsset(uint256,uint256)',
  'function buyAsset(uint256) payable',
  'function listings(uint256) view returns (address seller, uint256 price, bool isActive)',
  'function feePercentage() view returns (uint256)',
  'function rwaToken() view returns (address)',
  'event ApprovalStatus(uint256 tokenId, address seller, bool isApproved, bool isApprovedForAll)',
  'event TransferAttempt(uint256 tokenId, address from, address to, uint256 price)',
  'event PaymentCalculated(uint256 price, uint256 fee, uint256 sellerProceeds)'
];