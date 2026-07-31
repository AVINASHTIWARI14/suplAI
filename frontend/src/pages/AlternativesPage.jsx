import { useEffect, useState } from 'react';
import RiskBadge from '../components/RiskBadge.jsx';
import { fetchAlternatives } from '../api/client.js';
import { alternativeRowTone } from '../utils/risk.js';

const AlternativesPage = ({ companyId }) => {
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAlternatives(companyId)
      .then((data) => setAlternatives(data || []))
      .catch(() => setAlternatives([]))
      .finally(() => setLoading(false));
  }, [companyId]);

  return (
    <div className="page-body">
      <div>
        <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Alternatives</h1>
        <p style={{ color: '#8b9bb4', margin: '6px 0 0' }}>Ranked alternate suppliers — green is best, red is avoid.</p>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Location</th>
              <th>Cost Index</th>
              <th>Lead Time</th>
              <th>Risk</th>
              <th>Composite</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="loading-state">Loading alternatives…</td>
              </tr>
            ) : alternatives.length ? (
              alternatives.map((row, index) => {
                const composite = row.composite_score ?? 0;
                const tone = alternativeRowTone(composite);
                return (
                  <tr key={row.id} className={tone}>
                    <td>{index + 1}</td>
                    <td style={{ fontWeight: 700 }}>{row.name}</td>
                    <td>{row.location || row.country || '—'}</td>
                    <td>{row.cost_index != null ? row.cost_index.toFixed(1) : '—'}</td>
                    <td>{row.lead_time_days != null ? `${row.lead_time_days}d` : '—'}</td>
                    <td>
                      <RiskBadge score={row.risk_score ?? 0} />
                    </td>
                    <td style={{ fontWeight: 700 }}>{composite.toFixed(1)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="empty-state">No alternative suppliers for this company.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlternativesPage;
