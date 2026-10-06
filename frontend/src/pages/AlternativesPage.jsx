import { useEffect, useMemo, useState } from 'react';

import { fetchAlternatives } from '../api/client.js';
import supplierAvatar from '../assets/network/supplier_avatar.png';

const getRiskLevel = (score) => {
  const value = Number(score ?? 0);

  if (value >= 70) return 'HIGH';
  if (value >= 40) return 'MEDIUM';
  return 'LOW';
};

const AlternativesPage = ({ companyId }) => {
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);

    fetchAlternatives(companyId)
      .then((data) => setAlternatives(data || []))
      .catch(() => setAlternatives([]))
      .finally(() => setLoading(false));
  }, [companyId]);

  const filteredAlternatives = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return alternatives;
    }

    return alternatives.filter((supplier) => {
      const searchable = [
        supplier.name,
        supplier.location,
        supplier.country,
        supplier.category,
        supplier.industry,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [alternatives, searchTerm]);

  return (
    <div className="alternatives-page">
      {loading ? (
        <div
          className="alternatives-loading-state"
          aria-label="Loading alternatives"
        >
          <div className="dashboard-loading-spinner" aria-hidden="true" />
        </div>
      ) : (
      <div className="alternatives-content">
        <div className="alternatives-search-wrap">
          <span className="alternatives-search-icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            className="alternatives-search-input"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search alternative suppliers..."
            aria-label="Search alternative suppliers"
          />
          {searchTerm && (
            <button
              type="button"
              className="alternatives-search-clear"
              onClick={() => setSearchTerm('')}
              aria-label="Clear supplier search"
            >
              ×
            </button>
          )}
        </div>

        <div className="alternatives-table-card">
        <div className="alternatives-table-header">
          <div>Rank</div>
          <div>Supplier</div>
          <div>Location</div>
          <div>Cost Index</div>
          <div>Lead Time</div>
          <div>Risk</div>
          <div>Composite</div>
        </div>

        {filteredAlternatives.length ? (
          filteredAlternatives.map((supplier, index) => {
            const riskScore = Number(supplier.risk_score ?? 0);
            const riskLevel = getRiskLevel(riskScore);

            const costIndex =
              supplier.cost_index != null
                ? Number(supplier.cost_index).toFixed(1)
                : '—';

            const leadTime =
              supplier.lead_time_days != null
                ? `${supplier.lead_time_days}d`
                : '—';

            const composite =
              supplier.composite_score != null
                ? Number(supplier.composite_score).toFixed(1)
                : '—';

            return (
              <div
                className="alternative-table-row"
                key={supplier.id ?? index}
              >
                <div className="alternative-rank">
                  #{index + 1}
                </div>

                <div className="alternative-supplier">
                  <div className="alternative-avatar">
                    <img
                      src={supplierAvatar}
                      alt=""
                      aria-hidden="true"
                    />
                  </div>

                  <div className="alternative-supplier-info">
                    <strong>
                      {supplier.name || 'Unknown Supplier'}
                    </strong>

                    <span>
                      {supplier.category ||
                        supplier.industry ||
                        'Supplier'}
                    </span>
                  </div>
                </div>

                <div className="alternative-location">
                  {supplier.location ||
                    supplier.country ||
                    'Global'}
                </div>

                <div className="alternative-value">
                  {costIndex}
                </div>

                <div className="alternative-value">
                  {leadTime}
                </div>

                <div>
                  <span
                    className={`alternative-risk alternative-risk-${riskLevel.toLowerCase()}`}
                  >
                    {riskLevel}
                  </span>

                  <small className="alternative-risk-score">
                    {riskScore}
                  </small>
                </div>

                <div className="alternative-composite">
                  {composite}
                </div>
              </div>
            );
          })
        ) : (
          <div className="alternatives-state">
            {searchTerm
              ? 'No alternative suppliers match your search.'
              : 'No alternative suppliers for this company.'}
          </div>
        )}
        </div>
      </div>
      )}
    </div>
  );
};

export default AlternativesPage;
