import { useState } from 'react';
import { runNlpPipeline, recalculateRisk, geocodeAddress } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import SourceBadge from '../components/SourceBadge.jsx';

const SettingsPage = ({ companyId, companyName }) => {
  const { canEdit } = useAuth();
  const [nlpStatus, setNlpStatus] = useState('');
  const [riskStatus, setRiskStatus] = useState('');
  const [busy, setBusy] = useState(false);

  // Geocode / "Locate" tool
  const [address, setAddress] = useState('');
  const [geo, setGeo] = useState(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoError, setGeoError] = useState('');

  const onRunNlp = async () => {
    setBusy(true);
    setNlpStatus('Running news monitor (Hindi + English)…');
    try {
      const result = await runNlpPipeline();
      setNlpStatus(result.message || 'Pipeline completed.');
    } catch (err) {
      setNlpStatus(err.response?.data?.detail || 'Pipeline failed — check backend logs.');
    } finally {
      setBusy(false);
    }
  };

  const onRecalcRisk = async () => {
    setBusy(true);
    setRiskStatus('Recalculating supplier risk scores…');
    try {
      const result = await recalculateRisk(companyId);
      setRiskStatus(`Updated ${result.updated} suppliers. Overall risk: ${result.overall_risk_score}`);
    } catch (err) {
      setRiskStatus(err.response?.data?.detail || 'Recalculation failed.');
    } finally {
      setBusy(false);
    }
  };

  const onLocate = async () => {
    if (!address.trim()) return;
    setGeoBusy(true);
    setGeoError('');
    setGeo(null);
    try {
      const data = await geocodeAddress(address.trim());
      setGeo(data);
    } catch (err) {
      setGeoError(err.response?.data?.detail || 'Geocoding failed.');
    } finally {
      setGeoBusy(false);
    }
  };

  return (
    <div className="page-body">
      <div>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Settings &amp; Integration</h1>
        <p className="page-sub">Run NLP monitor and refresh risk scores for {companyName}.</p>
      </div>

      {!canEdit && (
        <div className="readonly-banner">Read-only access — pipeline and recalculation actions are restricted to admins.</div>
      )}

      <div className="card" style={{ display: 'grid', gap: 18 }}>
        <section>
          <h3 className="card-title">NLP Monitor</h3>
          <p className="muted" style={{ fontSize: '0.9rem' }}>
            Scrape Hindi + English RSS feeds, detect disruptions, save to database.
          </p>
          <button type="button" className="btn-primary" onClick={onRunNlp} disabled={busy || !canEdit}>
            Run news pipeline now
          </button>
          {nlpStatus && <p className="status-ok">{nlpStatus}</p>}
        </section>

        <section>
          <h3 className="card-title">Risk scoring</h3>
          <p className="muted" style={{ fontSize: '0.9rem' }}>
            Re-score suppliers using location, news severity, and history for the selected company.
          </p>
          <button type="button" className="btn-primary" onClick={onRecalcRisk} disabled={busy || !canEdit}>
            Recalculate risk scores
          </button>
          {riskStatus && <p className="status-ok">{riskStatus}</p>}
        </section>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 6 }}>Locate an address</h3>
        <p className="muted" style={{ fontSize: '0.9rem', marginTop: 0 }}>
          Resolve any address to coordinates via the geocoding service — use this when registering a new supplier or facility.
        </p>
        <div className="locate-row">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Pune, Maharashtra, India"
            onKeyDown={(e) => e.key === 'Enter' && onLocate()}
          />
          <button type="button" className="btn-header" onClick={onLocate} disabled={geoBusy || !address.trim()}>
            {geoBusy ? 'Locating…' : 'Locate'}
          </button>
        </div>
        {geoError && <div className="auth-error" style={{ marginTop: 8 }}>{geoError}</div>}
        {geo && (
          <div className="locate-result">
            <div className="locate-name">
              {geo.display_name || geo.query}
              <SourceBadge source={geo.source} />
            </div>
            <div className="locate-coords mono">
              lat {Number(geo.latitude).toFixed(4)} · lng {Number(geo.longitude).toFixed(4)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
