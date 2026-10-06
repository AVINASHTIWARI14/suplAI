import { useEffect, useState } from 'react';

import {
  runNlpPipeline,
  recalculateRisk,
  geocodeAddress,
} from '../api/client.js';

import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

import SourceBadge from '../components/SourceBadge.jsx';

const SettingsPage = ({ companyId, companyName }) => {
  const { canEdit, user, updateProfile } = useAuth();
  const { language, setLanguage, languages } = useLanguage();

  const [nlpStatus, setNlpStatus] = useState('');
  const [riskStatus, setRiskStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const [profileName, setProfileName] = useState(user?.full_name || '');
  const [profileStatus, setProfileStatus] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);

  // Geocode / "Locate" tool
  const [address, setAddress] = useState('');
  const [geo, setGeo] = useState(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoError, setGeoError] = useState('');

  useEffect(() => {
    setProfileName(user?.full_name || '');
  }, [user?.full_name]);

  const onSaveProfile = async (event) => {
    event.preventDefault();

    const nextName = profileName.trim();
    if (!nextName) {
      setProfileStatus('Profile update failed.');
      return;
    }

    setProfileBusy(true);
    setProfileStatus('');

    try {
      await updateProfile(nextName);
      setProfileStatus('Profile updated successfully.');
    } catch (err) {
      setProfileStatus(
        err.response?.data?.detail ||
          'Profile update failed.',
      );
    } finally {
      setProfileBusy(false);
    }
  };

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

      {/* PROFILE + LANGUAGE */}
      <div className="settings-preferences-grid">

        <section className="card settings-profile-card">
          <div className="settings-section-heading">
            <div>
              <h3 className="card-title">Profile Settings</h3>
              <p className="muted settings-section-copy">
                Edit your profile details.
              </p>
            </div>

            <div className="settings-profile-avatar" aria-hidden="true">
              {(user?.full_name || 'U').trim().charAt(0).toUpperCase()}
            </div>
          </div>

          <form className="settings-profile-form" onSubmit={onSaveProfile}>
            <label>
              <span>Name</span>
              <input
                type="text"
                value={profileName}
                onChange={(event) => {
                  setProfileName(event.target.value);
                  setProfileStatus('');
                }}
                maxLength={120}
                autoComplete="name"
              />
            </label>

            <label>
              <span>Email</span>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                readOnly
              />
            </label>

            <div className="settings-profile-readonly-grid">
              <div>
                <span>Role</span>
                <strong>{user?.role || 'viewer'}</strong>
              </div>

              <div>
                <span>Company</span>
                <strong>{companyName}</strong>
              </div>
            </div>

            <p className="muted settings-profile-note">
              Email and role are managed by the account system.
            </p>

            <button
              type="submit"
              className="btn-primary"
              disabled={profileBusy || !profileName.trim()}
            >
              {profileBusy ? 'Saving…' : 'Save Profile'}
            </button>

            {profileStatus && (
              <p className="status-ok settings-profile-status">
                {profileStatus}
              </p>
            )}
          </form>
        </section>

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
                <span className="settings-language-flag" aria-hidden="true">
                  {item.flag}
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

      </div>

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
