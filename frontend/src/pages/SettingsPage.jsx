import { useState } from 'react';

import {
  runNlpPipeline,
  recalculateRisk,
  geocodeAddress,
} from '../api/client.js';

import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

import SourceBadge from '../components/SourceBadge.jsx';

const CountryFlag = ({ code, label }) => {
  const common = {
    viewBox: '0 0 36 24',
    role: 'img',
    'aria-label': label,
  };

  switch (code) {
    case 'en':
      return (
        <svg {...common} className="settings-language-flag-svg">
          <rect width="36" height="24" fill="#b22234" />
          {[2, 6, 10, 14, 18, 22].map((y) => (
            <rect key={y} y={y} width="36" height="2" fill="#fff" />
          ))}
          <rect width="16" height="13" fill="#3c3b6e" />
          <g fill="#fff">
            {[
              [2, 2], [6, 2], [10, 2], [14, 2],
              [4, 5], [8, 5], [12, 5],
              [2, 8], [6, 8], [10, 8], [14, 8],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="0.7" />
            ))}
          </g>
        </svg>
      );
    case 'hi':
      return (
        <svg {...common} className="settings-language-flag-svg">
          <rect width="36" height="8" fill="#ff9933" />
          <rect y="8" width="36" height="8" fill="#fff" />
          <rect y="16" width="36" height="8" fill="#138808" />
          <circle cx="18" cy="12" r="3" fill="none" stroke="#000080" strokeWidth="1" />
          <circle cx="18" cy="12" r="0.8" fill="#000080" />
        </svg>
      );
    case 'es':
      return (
        <svg {...common} className="settings-language-flag-svg">
          <rect width="36" height="24" fill="#c60b1e" />
          <rect y="6" width="36" height="12" fill="#ffc400" />
        </svg>
      );
    case 'fr':
      return (
        <svg {...common} className="settings-language-flag-svg">
          <rect width="12" height="24" fill="#0055a4" />
          <rect x="12" width="12" height="24" fill="#fff" />
          <rect x="24" width="12" height="24" fill="#ef4135" />
        </svg>
      );
    case 'de':
      return (
        <svg {...common} className="settings-language-flag-svg">
          <rect width="36" height="8" fill="#000" />
          <rect y="8" width="36" height="8" fill="#dd0000" />
          <rect y="16" width="36" height="8" fill="#ffce00" />
        </svg>
      );
    case 'pt':
      return (
        <svg {...common} className="settings-language-flag-svg">
          <rect width="36" height="24" fill="#009739" />
          <polygon points="18,3 33,12 18,21 3,12" fill="#ffdf00" />
          <circle cx="18" cy="12" r="5" fill="#002776" />
        </svg>
      );
    case 'ja':
      return (
        <svg {...common} className="settings-language-flag-svg">
          <rect width="36" height="24" fill="#fff" />
          <circle cx="18" cy="12" r="6" fill="#bc002d" />
        </svg>
      );
    case 'zh':
      return (
        <svg {...common} className="settings-language-flag-svg">
          <rect width="36" height="24" fill="#de2910" />
          <polygon points="7,3 8.2,6.4 11.8,6.4 8.9,8.4 10,11.7 7,9.7 4,11.7 5.1,8.4 2.2,6.4 5.8,6.4" fill="#ffde00" />
        </svg>
      );
    case 'ar':
      return (
        <svg {...common} className="settings-language-flag-svg">
          <rect width="36" height="24" fill="#000" />
          <rect y="8" width="36" height="8" fill="#fff" />
          <rect y="16" width="36" height="8" fill="#00732f" />
          <rect width="8" height="24" fill="#ce1126" />
        </svg>
      );
    default:
      return (
        <svg {...common} className="settings-language-flag-svg">
          <rect width="36" height="24" rx="2" fill="#94a3b8" />
        </svg>
      );
  }
};

const SettingsPage = ({ companyId, companyName }) => {
  const { canEdit } = useAuth();
  const { language, setLanguage, languages } = useLanguage();

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
      setNlpStatus(
        err.response?.data?.detail ||
          'Pipeline failed — check backend logs.',
      );
    } finally {
      setBusy(false);
    }
  };

  const onRecalcRisk = async () => {
    setBusy(true);
    setRiskStatus('Recalculating supplier risk scores…');

    try {
      const result = await recalculateRisk(companyId);

      setRiskStatus(
        `Updated ${result.updated} suppliers. Overall risk: ${result.overall_risk_score}`,
      );
    } catch (err) {
      setRiskStatus(
        err.response?.data?.detail ||
          'Recalculation failed.',
      );
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
      setGeoError(
        err.response?.data?.detail ||
          'Geocoding failed.',
      );
    } finally {
      setGeoBusy(false);
    }
  };

  return (
    <div className="page-body">

      {/* HEADER */}
      <div>
        <h1 className="settings-page-title">
          Settings &amp; Integration
        </h1>

        <p className="page-sub">
          Run NLP monitor and refresh risk scores for {companyName}.
        </p>
      </div>

      {/* LANGUAGE & REGION */}
      <section className="card settings-language-card">
        <div>
          <h3 className="card-title">Language &amp; Region</h3>
          <p className="muted settings-section-copy">
            Choose the interface language for the entire SuplAI workspace.
          </p>
        </div>

        <label className="settings-language-select-label">
          <span>Language</span>

          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="settings-language-select"
          >
            {languages.map((item) => (
              <option key={item.code} value={item.code}>
                {item.flag} {item.label} — {item.country}
              </option>
            ))}
          </select>
        </label>

        <div className="settings-language-grid">
          {languages.map((item) => (
            <button
              key={item.code}
              type="button"
              className={
                `settings-language-option${
                  language === item.code ? ' is-selected' : ''
                }`
              }
              onClick={() => setLanguage(item.code)}
              aria-pressed={language === item.code}
            >
              <span
                className="settings-language-flag"
                aria-hidden="true"
              >
                <CountryFlag
                  code={item.code}
                  label={`${item.label} — ${item.country}`}
                />
              </span>

              <span className="settings-language-info">
                <strong>{item.label}</strong>
                <small>{item.country}</small>
              </span>

              {language === item.code && (
                <span className="settings-language-check" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>

        <p className="settings-language-note">
          Changes apply instantly across the interface.
        </p>
      </section>

      {/* READ ONLY NOTICE */}
      {!canEdit && (
        <div className="readonly-banner">
          Read-only access — pipeline and recalculation actions are
          restricted to admins.
        </div>
      )}

      {/* NLP + RISK SCORING */}
      <div
        className="card"
        style={{
          display: 'grid',
          gap: 18,
        }}
      >

        {/* NLP MONITOR */}
        <section>
          <h3 className="card-title">
            NLP Monitor
          </h3>

          <p
            className="muted"
            style={{
              fontSize: '0.9rem',
            }}
          >
            Scrape Hindi + English RSS feeds, detect disruptions,
            save to database.
          </p>

          <button
            type="button"
            className="btn-primary"
            onClick={onRunNlp}
            disabled={busy || !canEdit}
          >
            Run news pipeline now
          </button>

          {nlpStatus && (
            <p className="status-ok">
              {nlpStatus}
            </p>
          )}
        </section>

        {/* RISK SCORING */}
        <section>
          <h3 className="card-title">
            Risk scoring
          </h3>

          <p
            className="muted"
            style={{
              fontSize: '0.9rem',
            }}
          >
            Re-score suppliers using location, news severity,
            and history for the selected company.
          </p>

          <button
            type="button"
            className="btn-primary"
            onClick={onRecalcRisk}
            disabled={busy || !canEdit}
          >
            Recalculate risk scores
          </button>

          {riskStatus && (
            <p className="status-ok">
              {riskStatus}
            </p>
          )}
        </section>

      </div>

      {/* LOCATE ADDRESS */}
      <div className="card">

        <h3
          className="card-title"
          style={{
            marginBottom: 6,
          }}
        >
          Locate an address
        </h3>

        <p
          className="muted"
          style={{
            fontSize: '0.9rem',
            marginTop: 0,
          }}
        >
          Resolve any address to coordinates via the geocoding
          service — use this when registering a new supplier
          or facility.
        </p>

        <div className="locate-row">

          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Pune, Maharashtra, India"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onLocate();
              }
            }}
          />

          <button
            type="button"
            className="btn-header"
            onClick={onLocate}
            disabled={geoBusy || !address.trim()}
          >
            {geoBusy ? 'Locating…' : 'Locate'}
          </button>

        </div>

        {geoError && (
          <div
            className="auth-error"
            style={{
              marginTop: 8,
            }}
          >
            {geoError}
          </div>
        )}

        {geo && (
          <div className="locate-result">

            <div className="locate-name">
              {geo.display_name || geo.query}

              <SourceBadge source={geo.source} />
            </div>

            <div className="locate-coords mono">
              lat {Number(geo.latitude).toFixed(4)} · lng{' '}
              {Number(geo.longitude).toFixed(4)}
            </div>

          </div>
        )}

      </div>

    </div>
  );
};

export default SettingsPage;
