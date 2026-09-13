import RiskBadge from './RiskBadge.jsx';
import { compositeFromSupplier, riskColor } from '../utils/risk.js';

const SupplierCard = ({ supplier, rank }) => {
  const risk = supplier.risk_score ?? 0;
  const composite = supplier.composite_score ?? compositeFromSupplier(supplier);
  const stars = Math.max(1, Math.min(5, Math.round((supplier.rating ?? (100 - risk) / 20))));

  return (
    <div className="card supplier-card">
      {rank != null && (
        <div className="supplier-card-rank">#{rank}</div>
      )}
      <div className="supplier-card-header">
        <div className="supplier-card-name">{supplier.name}</div>
        <RiskBadge score={risk} />
      </div>
      <div className="supplier-card-location">
        {supplier.location || supplier.country || 'Unknown'}
      </div>
      <div className="supplier-card-metrics">
        <span className="supplier-card-rating">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
        <span className="supplier-card-score" style={{ color: riskColor(risk) }}>Score {Math.round(risk)}</span>
      </div>
      <div className="supplier-card-composite">Composite {composite}</div>
    </div>
  );
};

export default SupplierCard;
