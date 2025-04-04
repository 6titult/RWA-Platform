import { Card, Button, Badge } from 'react-bootstrap';
import { Asset } from '../types/index';

interface AssetCardProps {
  asset: Asset;
  onBuy: () => void;
  onList: () => void;
  isOwner: boolean;
}

export default function AssetCard({ asset, onBuy, onList, isOwner }: AssetCardProps) {
  // Format the valuation to display with commas and 2 decimal places
  const formattedValuation = parseFloat(asset.valuation).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  // Format the price if it exists
  const formattedPrice = asset.price ? parseFloat(asset.price).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }) : '';

  // Format the owner address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Card className="asset-card">
      <Card.Body>
        <div className="asset-header">
          <h4>Asset #{asset.id}</h4>
          {asset.listed ? (
            <Badge bg="success" pill>Listed</Badge>
          ) : (
            <Badge bg="secondary" pill>Not Listed</Badge>
          )}
        </div>

        <div className="asset-details">
          <p>
            <strong>Valuation:</strong>
            <span className="value">{formattedValuation} ETH</span>
          </p>
          <p>
            <strong>Audit Date:</strong>
            <span className="value">{asset.auditDate}</span>
          </p>
          <p>
            <strong>Owner:</strong>
            <span className="value" title={asset.owner}>{formatAddress(asset.owner)}</span>
          </p>
          {asset.listed && (
            <p className="price-tag">
              <strong>Price:</strong>
              <span className="value highlight">{formattedPrice} ETH</span>
            </p>
          )}
        </div>

        <div className="asset-actions">
          {asset.listed && !isOwner && (
            <Button
              variant="primary"
              onClick={onBuy}
              className="w-100 mb-2"
            >
              <i className="bi bi-cart-plus me-2"></i>
              Buy Now
            </Button>
          )}
          {isOwner && !asset.listed && (
            <Button
              variant="outline-primary"
              onClick={onList}
              className="w-100"
            >
              <i className="bi bi-tag me-2"></i>
              List for Sale
            </Button>
          )}
          {isOwner && asset.listed && (
            <div className="owner-badge">
              <i className="bi bi-person-check me-1"></i>
              You own this asset
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}