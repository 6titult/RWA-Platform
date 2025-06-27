import { Card, Button, Badge } from 'react-bootstrap';
import { Asset } from '../types/index';

interface AssetCardProps {
  asset: Asset;
  onBuy: () => void;
  onList: () => void;
  isOwner: boolean;
  loading?: boolean;
}

export default function AssetCard({ asset, onBuy, onList, isOwner, loading = false }: AssetCardProps) {
  // Log the isOwner value for debugging
  console.log("Asset #" + asset.id + " isOwner:", isOwner);
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

  // Format the USD price if it exists
  console.log(`Asset #${asset.id} priceInUSD:`, asset.priceInUSD);
  const formattedUSDPrice = asset.priceInUSD ? parseFloat(asset.priceInUSD).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
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
          <p className="marketplace-info">
            <strong>Marketplace:</strong>
            <span className="value" title={asset.marketplace}>
              {formatAddress(asset.marketplace)}
            </span>
          </p>
          {asset.listed && (
            <div className="price-info">
              <div className="eth-price">
                <i className="bi bi-currency-ethereum me-1"></i>
                {formattedPrice} ETH
              </div>
              {formattedUSDPrice ? (
                <div className="usd-price">
                  <i className="bi bi-currency-dollar me-1"></i>
                  {formattedUSDPrice} USD
                </div>
              ) : (
                <div className="usd-price text-muted">
                  <i className="bi bi-currency-dollar me-1"></i>
                  USD price unavailable
                </div>
              )}
            </div>
          )}
        </div>

        <div className="asset-actions">
          {asset.listed && !isOwner && (
            <Button
              variant="primary"
              onClick={onBuy}
              className="w-100 mb-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Buying...
                </>
              ) : (
                <>
                  <i className="bi bi-cart-plus me-2"></i>
                  Buy Now
                </>
              )}
            </Button>
          )}
          {isOwner && !asset.listed && (
            <Button
              variant="outline-primary"
              onClick={onList}
              className="w-100"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Listing...
                </>
              ) : (
                <>
                  <i className="bi bi-tag me-2"></i>
                  List for Sale
                </>
              )}
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





