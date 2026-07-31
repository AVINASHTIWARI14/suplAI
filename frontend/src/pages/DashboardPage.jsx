import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import MapPanel from '../components/MapPanel.jsx';
import RiskBadge from '../components/RiskBadge.jsx';
import DisruptionCard from '../components/DisruptionCard.jsx';
import Gauge from '../components/Gauge.jsx';
import { fetchDashboard, fetchSupplierRisk, fetchGraph, fetchActiveDisruptions, fetchRiskTrend } from '../api/client.js';
import { buildRiskTrend, formatDate, timeAgo } from '../utils/dates.js';
import { riskColor, severityFromEvent } from '../utils/risk.js';
import { resolveCoordinates } from '../utils/geocode.js';

const iconForType = (type = '') => {
  const t = type.toLowerCase();
  if (t.includes('port') || t.includes('ship')) return '🚢';
  if (t.includes('factory') || t.includes('plant')) return '🏭';
  if (t.includes('flood') || t.includes('weather')) return '🌊';
  return '⚠️';
};

const DashboardPage = ({ companyId, company, onRiskChange, apiOnline }) => {
  const [dashboard, setDashboard] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [graph, setGraph] = useState(null);
  const [feed, setFeed] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchDashboard(companyId),
      fetchSupplierRisk(companyId),
      fetchGraph(companyId),
      fetchActiveDisruptions().catch(() => []),
      fetchRiskTrend(companyId),
    ])
      .then(([dash, supplierList, graphData, disruptions, trend]) => {
        setDashboard(dash);
        setSuppliers(supplierList);
        setGraph(graphData);
        setFeed(disruptions);
        setTrendData(trend || []);
      })
      .catch((err) => setError(err?.response?.data?.detail || err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [companyId]);

  useEffect(() => {
    onRiskChange?.(dashboard?.overall_risk_score ?? 0);
  }, [dashboard?.overall_risk_score]);

  const riskTrend = useMemo(() => {
    if (trendData.length) return trendData;
    return buildRiskTrend(dashboard?.overall_risk_score ?? 0);
  }, [trendData, dashboard?.overall_risk_score]);

  const activeDisruptions = dashboard?.active_disruptions ?? [];
  const topRisky = dashboard?.top_risky_suppliers ?? [];
  const feedItems = feed.length ? feed.slice(0, 4) : activeDisruptions.slice(0, 4);

  const companyCoords = useMemo(
    () => resolveCoordinates({ location: company?.location, country: company?.country, id: companyId }),
    [company, companyId],
  );

  if (loading) return <div className="page-body loading-state">Loading dashboard from database…</div>;
  if (error) {
    return (
      <div className="page-body error-state">
        <h2 style={{ marginTop: 0 }}>Could not load dashboard</h2>
        <p>{error}</p>
        <p style={{ color: '#8b9bb4', fontSize: '0.9rem' }}>
          {apiOnline === false
            ? 'Start the backend in a terminal: python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload'
            : 'Check .env has SUPABASE_URL and SUPABASE_SERVICE_KEY, then restart the backend.'}
        </p>
      </div>
    );
  }

  return (
    <div className="page-body">
      <div className="dashboard-grid-top">
        <section className="card">
          <div className="card-header">
            <h3 className="card-title">Active Disruptions</h3>
            <Link className="card-link" to="/disruptions">View All</Link>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {activeDisruptions.length ? (
              activeDisruptions.slice(0, 4).map((event) => {
                const severity = severityFromEvent(event);
                return (
                  <div key={event.id} className="disruption-item">
                    <div className={`disruption-icon${severity === 'medium' ? ' medium' : ''}`}>
                      {iconForType(event.event_type)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                        {event.event_type || 'Disruption'}
                        {event.location ? ` in ${event.location}` : ''}
                      </div>
                      <div style={{ color: '#8b9bb4', fontSize: '0.78rem', marginTop: 4 }}>
                        {event.affected_industry || 'Supply chain'} · {event.country || 'Global'}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: 4 }}>
                        {formatDate(event.start_date)} · {timeAgo(event.start_date)}
                      </div>
                    </div>
                    <RiskBadge score={0} severity={severity} />
                  </div>
                );
              })
            ) : (
              <div className="empty-state">No active disruptions</div>
            )}
          </div>
        </section>

        <MapPanel suppliers={suppliers} graph={graph} companyCoords={companyCoords} />

        <section className="card">
          <div className="card-header">
            <h3 className="card-title">Top 3 Risky Suppliers</h3>
            <Link className="card-link" to="/suppliers">View All</Link>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {topRisky.slice(0, 3).map((supplier) => {
              const score = Math.round(supplier.risk_score ?? 0);
              return (
                <div key={supplier.id} className="supplier-risk-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{supplier.name}</div>
                      <div style={{ color: '#8b9bb4', fontSize: '0.82rem', marginTop: 4 }}>
                        {supplier.location || supplier.country}
                      </div>
                    </div>
                    <div className="score" style={{ color: riskColor(score) }}>{score}</div>
                  </div>
                  <div className="risk-bar">
                    <span style={{ width: `${score}%`, background: riskColor(score) }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="dashboard-grid-bottom">
        <section className="card risk-twin-card">
          {/* Network Risk */}
          <div className="risk-twin-half">
            <div className="card-title" style={{ textAlign: 'center', marginBottom: 8 }}>Network Risk</div>
            <div style={{ fontSize: '3rem', fontWeight: 800, textAlign: 'center', color: riskColor(dashboard?.overall_risk_score ?? 0), lineHeight: 1 }}>
              {Math.round(dashboard?.overall_risk_score ?? 0)}
            </div>
            <div style={{ textAlign: 'center', color: '#8b9bb4', fontSize: '0.85rem', marginTop: 6 }}>Overall index</div>
          </div>

          <div className="risk-twin-divider" />

          {/* Overall Risk Score Gauge */}
          <div className="risk-twin-half">
            <Gauge value={dashboard?.overall_risk_score ?? 0} />
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h3 className="card-title">Risk Score Trend</h3>
            <select defaultValue="30" style={{ width: 'auto', minWidth: 120 }}>
              <option value="30">Last 30 Days</option>
            </select>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={riskTrend} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#8b9bb4', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#8b9bb4', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0f1a2e', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8 }}
                  labelStyle={{ color: '#8b9bb4' }}
                />
                <Line type="monotone" dataKey="score" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 3, fill: '#38bdf8' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h3 className="card-title">Disruption Feed</h3>
            <Link className="card-link" to="/disruptions">View All</Link>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {feedItems.length ? (
              feedItems.map((event) => (
                <div key={event.id} style={{ padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{event.event_type || 'Event'}</div>
                    <RiskBadge score={0} severity={severityFromEvent(event)} />
                  </div>
                  <div style={{ color: '#8b9bb4', fontSize: '0.8rem', marginTop: 6 }}>
                    {event.location}{event.country ? `, ${event.country}` : ''}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: 6 }}>{timeAgo(event.start_date)}</div>
                </div>
              ))
            ) : (
              <div className="empty-state">No feed items</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
