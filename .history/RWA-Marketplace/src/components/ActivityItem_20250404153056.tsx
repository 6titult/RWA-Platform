import React from 'react';
import { Badge } from 'react-bootstrap';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItemProps {
  result: {
    action: string;
    status: 'pending' | 'success' | 'error';
    timestamp: number;
    txHash?: string;
    details?: string;
    error?: string;
    amount?: string;
    assetId?: number;
  };
}

export default function ActivityItem({ result }: ActivityItemProps) {
  const getActivityIcon = () => {
    switch (result.action) {
      case 'mint': return 'bi-plus-circle-fill text-success';
      case 'list': return 'bi-tag-fill text-primary';
      case 'buy': return 'bi-cart-fill text-info';
      case 'approve': return 'bi-check-circle-fill text-warning';
      default: return 'bi-arrow-right-circle-fill';
    }
  };

  const getStatusBadge = () => {
    switch (result.status) {
      case 'pending':
        return <Badge bg="warning">Pending</Badge>;
      case 'success':
        return <Badge bg="success">Success</Badge>;
      case 'error':
        return <Badge bg="danger">Failed</Badge>;
      default:
        return null;
    }
  };

  const getActionDescription = () => {
    const asset = result.assetId ? `Asset #${result.assetId}` : 'Asset';
    switch (result.action) {
      case 'mint':
        return `Minted new ${asset}`;
      case 'list':
        return `Listed ${asset} ${result.amount ? `for ${result.amount} ETH` : ''}`;
      case 'buy':
        return `Purchased ${asset} ${result.amount ? `for ${result.amount} ETH` : ''}`;
      case 'approve':
        return `Approved ${asset} for marketplace`;
      default:
        return result.details || 'Transaction executed';
    }
  };

  return (
    <div className="activity-item">
      <div className="activity-header">
        <div className="activity-main-info">
          <span className="activity-type">
            <i className={`bi ${getActivityIcon()} me-2`}></i>
            {getActionDescription()}
          </span>
          {getStatusBadge()}
        </div>
        <span className="activity-time">
          {formatDistanceToNow(result.timestamp, { addSuffix: true })}
        </span>
      </div>
      
      <div className="activity-content">
        {result.error && (
          <div className="error-message">
            <i className="bi bi-exclamation-triangle-fill me-1"></i>
            {result.error}
          </div>
        )}
        {result.txHash && (
          <div className="transaction-links">
            <a
              href={`https://sepolia.etherscan.io/tx/${result.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tx-link"
            >
              <i className="bi bi-box-arrow-up-right me-1"></i>
              View on Etherscan
            </a>
          </div>
        )}
      </div>
    </div>
  );
}


