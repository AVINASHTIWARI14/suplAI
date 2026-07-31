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
    const values = suppliers.map((s) => s.country || s.location || 'Unknown').filter(Boolean);
    return ['All', ...Array.from(new Set(values))];
  }, [suppliers]);

  const filtered = useMemo(() => {
    return suppliers
      .map((s) => ({ ...s, composite_score: s.composite_score ?? compositeFromSupplier(s) }))
      .filter((s) => {
        const name = (s.name || '').toLowerCase();
        const loc = `${s.country || ''} ${s.location || ''}`.toLowerCase();
        const risk = s.risk_score ?? 0;
        const cost = s.cost_index ?? 50;
        const lead = s.lead_time_days ?? 30;
        return (
          name.includes(search.toLowerCase()) &&
          (country === 'All' || loc.includes(country.toLowerCase())) &&
          risk <= riskMax &&
          cost <= costMax &&
          lead <= leadMax
        );
      })
      .sort((a, b) => (b.composite_score ?? 0) - (a.composite_score ?? 0));
  }, [suppliers, search, country, riskMax, costMax, leadMax]);

  return (
    <div className="page-body">
      <div>
        <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Supplier Explorer</h1>
        <p style={{ color: '#8b9bb4', margin: '6px 0 0' }}>Search and filter suppliers by risk, cost, and lead time.</p>
      </div>

      <div className="explorer-layout">
        <aside className="card filters-panel">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers…"
          />
          <div className="filter-row">
            <label>Country</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)}>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="filter-row">
            <label>Max risk score: {riskMax}</label>
            <input type="range" min="0" max="100" value={riskMax} onChange={(e) => setRiskMax(Number(e.target.value))} />
          </div>
          <div className="filter-row">
            <label>Max cost index: {costMax}</label>
            <input type="range" min="0" max="100" value={costMax} onChange={(e) => setCostMax(Number(e.target.value))} />
          </div>
          <div className="filter-row">
            <label>Max lead time (days): {leadMax}</label>
            <input type="range" min="1" max="90" value={leadMax} onChange={(e) => setLeadMax(Number(e.target.value))} />
          </div>
        </aside>

        <div className="supplier-grid">
          {loading ? (
            <div className="card loading-state">Loading suppliers…</div>
          ) : filtered.length ? (
            filtered.map((supplier, index) => (
              <SupplierCard key={supplier.id} supplier={supplier} rank={index + 1} />
            ))
          ) : (
            <div className="card empty-state">No suppliers match your filters.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierExplorerPage;
