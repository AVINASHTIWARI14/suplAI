import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [countryOpen, setCountryOpen] = useState(false);
  const countryDropdownRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!countryDropdownRef.current?.contains(event.target)) {
        setCountryOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

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
        const location = `${supplier.country || ''} ${
          supplier.location || ''
        }`.toLowerCase();
        const risk = Number(supplier.risk_score ?? 0);
        const cost = Number(supplier.cost_index ?? 50);
        const lead = Number(supplier.lead_time_days ?? 30);

        return (
          name.includes(query) &&
          (country === 'All' ||
            location.includes(country.toLowerCase())) &&
          risk <= riskMax &&
          cost <= costMax &&
          lead <= leadMax
        );
      })
      .sort(
        (a, b) =>
          Number(b.composite_score ?? 0) -
          Number(a.composite_score ?? 0),
      );
  }, [suppliers, search, country, riskMax, costMax, leadMax]);

  const resetFilters = () => {
    setSearch('');
    setCountry('All');
    setRiskMax(100);
    setCostMax(100);
    setLeadMax(90);
    setCountryOpen(false);
  };

  const makeTicks = (min, max, count = 10) =>
    Array.from({ length: count + 1 }, (_, index) =>
      Math.round(min + ((max - min) / count) * index),
    );

  const riskTicks = makeTicks(0, 100);
  const costTicks = makeTicks(0, 100);
  const leadTicks = makeTicks(1, 90);

  const supplierInteractionStyles = `
    /* Supplier cards — extremely subtle hover only */
    .supplier-explorer-page .supplier-card {
      transition:
        transform 180ms ease,
        box-shadow 180ms ease,
        border-color 180ms ease !important;
    }

    .supplier-explorer-page .supplier-card:hover {
      transform: scale(1.012) !important;
      filter: none !important;
      opacity: 1 !important;
      z-index: 10 !important;
      box-shadow: 0 12px 26px rgba(0, 0, 0, 0.22) !important;
    }

    /* Never change the other cards when one card is hovered */
    .supplier-explorer-page
      .supplier-grid:has(.supplier-card:hover)
      .supplier-card:not(:hover) {
      transform: none !important;
      filter: none !important;
      opacity: 1 !important;
    }

    .supplier-explorer-page .supplier-card:active {
      transform: scale(1.005) !important;
    }
  `;

  if (loading) {
    return (
      <div className="supplier-loading-fullscreen">
        <span
          className="dashboard-loading-spinner"
          role="status"
          aria-label="Loading suppliers"
        />
      </div>
    );
  }

  return (
    <div className="supplier-explorer-page">
      <style>{supplierInteractionStyles}</style>

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

        <div
          className={`supplier-country-wrap${
            countryOpen ? ' is-open' : ''
          }`}
          ref={countryDropdownRef}
        >
          <label htmlFor="supplier-country-button">
            Country
          </label>

          <button
            id="supplier-country-button"
            type="button"
            className="supplier-country-select"
            aria-haspopup="listbox"
            aria-expanded={countryOpen}
            onClick={() => setCountryOpen((open) => !open)}
          >
            <span>{country}</span>

            <span
              className="supplier-country-chevron-v2"
              aria-hidden="true"
            />
          </button>

          {countryOpen && (
            <div
              className="supplier-country-options"
              role="listbox"
            >
              {countries.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`supplier-country-option${
                    country === item ? ' is-selected' : ''
                  }`}
                  role="option"
                  aria-selected={country === item}
                  onClick={() => {
                    setCountry(item);
                    setCountryOpen(false);
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className="supplier-reset-button"
          onClick={resetFilters}
        >
          Reset
        </button>
      </section>

      <section className="supplier-explorer-content">
        <aside className="supplier-filters-panel">
          <div
            className="supplier-range"
            style={{
              '--min': 0,
              '--val': riskMax,
              '--max': 100,
              '--n': 10,
              '--slider-percent': `${riskMax}%`,
            }}
          >
            <label htmlFor="supplier-risk-range">
              Risk Score
            </label>

            <div className="supplier-range-slider">
              <div
                className="supplier-range-track"
                style={{
                  '--slider-percent': `${riskMax}%`,
                }}
                aria-hidden="true"
              >
                <span className="supplier-range-track-fill" />
              </div>

              <input
                id="supplier-risk-range"
                type="range"
                min="0"
                max="100"
                value={riskMax}
                list="risk-range-list"
                onChange={(event) =>
                  setRiskMax(Number(event.target.value))
                }
              />
            </div>

            <output htmlFor="supplier-risk-range">
              {riskMax}
            </output>

            <datalist id="risk-range-list">
              {riskTicks.map((value, index) => (
                <option key={index} value={value}>
                  {value}
                </option>
              ))}
            </datalist>
          </div>

          <div
            className="supplier-range"
            style={{
              '--min': 0,
              '--val': costMax,
              '--max': 100,
              '--n': 10,
              '--slider-percent': `${costMax}%`,
            }}
          >
            <label htmlFor="supplier-cost-range">
              Cost Index
            </label>

            <div className="supplier-range-slider">
              <div
                className="supplier-range-track"
                style={{
                  '--slider-percent': `${costMax}%`,
                }}
                aria-hidden="true"
              >
                <span className="supplier-range-track-fill" />
              </div>

              <input
                id="supplier-cost-range"
                type="range"
                min="0"
                max="100"
                value={costMax}
                list="cost-range-list"
                onChange={(event) =>
                  setCostMax(Number(event.target.value))
                }
              />
            </div>

            <output htmlFor="supplier-cost-range">
              {costMax}
            </output>

            <datalist id="cost-range-list">
              {costTicks.map((value, index) => (
                <option key={index} value={value}>
                  {value}
                </option>
              ))}
            </datalist>
          </div>

          <div
            className="supplier-range"
            style={{
              '--min': 1,
              '--val': leadMax,
              '--max': 90,
              '--n': 10,
              '--slider-percent': `${
                ((leadMax - 1) / 89) * 100
              }%`,
            }}
          >
            <label htmlFor="supplier-lead-range">
              Lead Time
            </label>

            <div className="supplier-range-slider">
              <div
                className="supplier-range-track"
                style={{
                  '--slider-percent': `${
                    ((leadMax - 1) / 89) * 100
                  }%`,
                }}
                aria-hidden="true"
              >
                <span className="supplier-range-track-fill" />
              </div>

              <input
                id="supplier-lead-range"
                type="range"
                min="1"
                max="90"
                value={leadMax}
                list="lead-range-list"
                onChange={(event) =>
                  setLeadMax(Number(event.target.value))
                }
              />
            </div>

            <output htmlFor="supplier-lead-range">
              {leadMax} days
            </output>

            <datalist id="lead-range-list">
              {leadTicks.map((value, index) => (
                <option key={index} value={value}>
                  {value}
                </option>
              ))}
            </datalist>
          </div>
        </aside>

        <div className="supplier-results">
          {filtered.length ? (
            <div className="supplier-grid">
              {filtered.map((supplier, index) => (
                <SupplierCard
                  key={
                    supplier.id ??
                    `${supplier.name}-${index}`
                  }
                  supplier={supplier}
                  rank={index + 1}
                />
              ))}
            </div>
          ) : (
            <div className="supplier-state-card">
              <strong>
                No suppliers match your filters.
              </strong>

              <span>
                Try widening the risk, cost, or lead-time limits.
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SupplierExplorerPage;