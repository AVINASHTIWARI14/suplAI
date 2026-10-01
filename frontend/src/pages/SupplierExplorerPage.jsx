import { useEffect, useMemo, useState } from 'react';
import SupplierCard from '../components/SupplierCard.jsx';
import { fetchSupplierRisk } from '../api/client.js';
import { compositeFromSupplier } from '../utils/risk.js';

const SupplierExplorerPage = ({ companyId }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('All');
  const [riskMax, setRiskMax] = useState(100);
  const [costMax, setCostMax] = useState(100);
  const [leadMax, setLeadMax] = useState(90);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    fetchSupplierRisk(companyId)
      .then((data) => setSuppliers(data || []))
      .catch(() => setSuppliers([]))
      .finally(() => setLoading(false));
  }, [companyId]);

  const countries = useMemo(() => {
    const values = suppliers
      .map((supplier) => supplier.country || supplier.location || 'Unknown')
      .filter(Boolean);

    return ['All', ...Array.from(new Set(values))];
  }, [suppliers]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return suppliers
      .map((supplier) => ({
        ...supplier,
        composite_score:
          supplier.composite_score ?? compositeFromSupplier(supplier),
      }))
      .filter((supplier) => {
        const name = (supplier.name || '').toLowerCase();
        const location = `${supplier.country || ''} ${supplier.location || ''}`.toLowerCase();
        const risk = Number(supplier.risk_score ?? 0);
        const cost = Number(supplier.cost_index ?? 50);
        const lead = Number(supplier.lead_time_days ?? 30);

        return (
          name.includes(query) &&
          (country === 'All' || location.includes(country.toLowerCase())) &&
          risk <= riskMax &&
          cost <= costMax &&
          lead <= leadMax
        );
      })
      .sort(
        (a, b) => Number(b.composite_score ?? 0) - Number(a.composite_score ?? 0)
      );
  }, [suppliers, search, country, riskMax, costMax, leadMax]);

  const resetFilters = () => {
    setSearch('');
    setCountry('All');
    setRiskMax(100);
    setCostMax(100);
    setLeadMax(90);
  };

  const makeTicks = (min, max, count = 10) =>
    Array.from({ length: count + 1 }, (_, index) =>
      Math.round(min + ((max - min) / count) * index)
    );

  const riskTicks = makeTicks(0, 100);
  const costTicks = makeTicks(0, 100);
  const leadTicks = makeTicks(1, 90);

  return (
    <div className="supplier-explorer-page">
      <section className="supplier-explorer-header">
        <div>
          <p className="supplier-explorer-eyebrow">SUPPLIER INTELLIGENCE</p>
          <h1>Supplier Explorer</h1>
          <p className="supplier-explorer-subtitle">
            Search and filter suppliers by risk, cost, and lead time.
          </p>
        </div>
      </section>

      <section className="supplier-explorer-toolbar">
        <div className="supplier-search-wrap">
          <span className="supplier-search-icon">⌕</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search suppliers..."
            aria-label="Search suppliers"
          />
        </div>

        <div className="supplier-country-wrap">
          <label htmlFor="supplier-country">Country</label>
          <select
            id="supplier-country"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
          >
            {countries.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="supplier-reset-button" onClick={resetFilters}>
          Reset
        </button>
      </section>

      <section className="supplier-explorer-content">
        <aside className="supplier-filters-panel">
          <div
            className="supplier-range"
            style={{ '--min': 0, '--val': riskMax, '--max': 100, '--n': 10 }}
          >
            <label htmlFor="supplier-risk-range">Risk Score</label>
            <input
              id="supplier-risk-range"
              type="range"
              min="0"
              max="100"
              value={riskMax}
              list="risk-range-list"
              onChange={(event) => setRiskMax(Number(event.target.value))}
            />
            <output htmlFor="supplier-risk-range">{riskMax}</output>
            <datalist id="risk-range-list">
              {riskTicks.map((value, index) => (
                <option key={index} value={value}>{value}</option>
              ))}
            </datalist>
          </div>

          <div
            className="supplier-range"
            style={{ '--min': 0, '--val': costMax, '--max': 100, '--n': 10 }}
          >
            <label htmlFor="supplier-cost-range">Cost Index</label>
            <input
              id="supplier-cost-range"
              type="range"
              min="0"
              max="100"
              value={costMax}
              list="cost-range-list"
              onChange={(event) => setCostMax(Number(event.target.value))}
            />
            <output htmlFor="supplier-cost-range">{costMax}</output>
            <datalist id="cost-range-list">
              {costTicks.map((value, index) => (
                <option key={index} value={value}>{value}</option>
              ))}
            </datalist>
          </div>

          <div
            className="supplier-range"
            style={{ '--min': 1, '--val': leadMax, '--max': 90, '--n': 10 }}
          >
            <label htmlFor="supplier-lead-range">Lead Time</label>
            <input
              id="supplier-lead-range"
              type="range"
              min="1"
              max="90"
              value={leadMax}
              list="lead-range-list"
              onChange={(event) => setLeadMax(Number(event.target.value))}
            />
            <output htmlFor="supplier-lead-range">{leadMax} days</output>
            <datalist id="lead-range-list">
              {leadTicks.map((value, index) => (
                <option key={index} value={value}>{value}</option>
              ))}
            </datalist>
          </div>
        </aside>

        <div className="supplier-results">
          {loading ? (
            <div className="supplier-state-card">
              <span
                className="dashboard-loading-spinner"
                role="status"
                aria-label="Loading suppliers"
              />
            </div>
          ) : filtered.length ? (
            <div className="supplier-grid">
              {filtered.map((supplier, index) => (
                <SupplierCard
                  key={supplier.id ?? `${supplier.name}-${index}`}
                  supplier={supplier}
                  rank={index + 1}
                />
              ))}
            </div>
          ) : (
            <div className="supplier-state-card">
              <strong>No suppliers match your filters.</strong>
              <span>Try widening the risk, cost, or lead-time limits.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SupplierExplorerPage;
