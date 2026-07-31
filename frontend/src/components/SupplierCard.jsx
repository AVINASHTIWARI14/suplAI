import RiskBadge from './RiskBadge.jsx';
import { compositeFromSupplier, riskColor } from '../utils/risk.js';

const SupplierCard = ({ supplier, rank }) => {
  const risk = supplier.risk_score ?? 0;
  const composite = supplier.composite_score ?? compositeFromSupplier(supplier);
  const stars = Math.max(1, Math.min(5, Math.round((supplier.rating ?? (100 - risk) / 20))));

  return (
    <div className="card supplier-card">
      {rank != null && (
        <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 6 }}>#{rank}</div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700 }}>{supplier.name}</div>
          <div style={{ color: '#8b9bb4', fontSize: '0.85rem', marginTop: 4 }}>
            {supplier.location || supplier.country || 'Unknown'}
          </div>
        </div>
        <RiskBadge score={risk} />
      </div>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#8b9bb4', fontSize: '0.82rem' }}>{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
        <span style={{ color: riskColor(risk), fontWeight: 700 }}>Score {Math.round(risk)}</span>
      </div>
      <div style={{ marginTop: 8, fontSize: '0.8rem', color: '#64748b' }}>Composite {composite}</div>
    </div>
  );
};

export default SupplierCard;
