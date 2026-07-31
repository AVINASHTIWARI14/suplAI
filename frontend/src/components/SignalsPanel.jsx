import { useEffect, useState } from 'react';
import SourceBadge from './SourceBadge.jsx';
import { fetchNews, fetchFx, fetchWeather } from '../api/client.js';
import { timeAgo } from '../utils/dates.js';

const severityColor = (sev = '') => {
  const s = sev.toLowerCase();
  if (s.includes('high') || s.includes('severe') || s.includes('critical')) return '#ef4444';
  if (s.includes('med') || s.includes('moderate')) return '#f59e0b';
  return '#22c55e';
};

/**
 * External risk-signal strip: live news headlines + an FX and weather
 * risk indicator. All data comes from the backend /external/* endpoints.
 */
const SignalsPanel = ({ company, newsQuery }) => {
  const [news, setNews] = useState(null);
  const [fx, setFx] = useState(null);
  const [weather, setWeather] = useState(null);
  const [newsLoading, setNewsLoading] = useState(true);

  const query = newsQuery || `${company?.name || ''} supply chain disruption`.trim();
  const location = company?.location || company?.country;

  useEffect(() => {
    let alive = true;
    setNewsLoading(true);
    fetchNews(query)
      .then((d) => alive && setNews(d))
      .catch(() => alive && setNews(null))
      .finally(() => alive && setNewsLoading(false));
    fetchFx('INR', 'USD')
      .then((d) => alive && setFx(d))
      .catch(() => alive && setFx(null));
    fetchWeather({ location })
      .then((d) => alive && setWeather(d))
      .catch(() => alive && setWeather(null));
    return () => {
      alive = false;
    };
  }, [query, location]);

  return (
    <div className="signals-panel">
      <div className="signals-indicators">
        <div className="signal-card">
          <div className="signal-head">
            <span className="card-title">FX Risk · USD/INR</span>
            <SourceBadge source={fx?.source} />
          </div>
          {fx ? (
            <>
              <div className="mono big">{fx.rate != null ? Number(fx.rate).toFixed(2) : '—'}</div>
              <div className="signal-meta">
                <span className="muted">vol {fx.volatility != null ? `${(fx.volatility * 100).toFixed(1)}%` : '—'}</span>
                <span style={{ color: severityColor(fx.risk_contribution > 50 ? 'high' : fx.risk_contribution > 25 ? 'med' : 'low') }}>
                  risk +{Math.round(fx.risk_contribution ?? 0)}
                </span>
              </div>
            </>
          ) : (
            <div className="muted" style={{ fontSize: '0.8rem' }}>unavailable</div>
          )}
        </div>

        <div className="signal-card">
          <div className="signal-head">
            <span className="card-title">Weather · {location || 'HQ'}</span>
            <SourceBadge source={weather?.source} />
          </div>
          {weather ? (
            <>
              <div className="mono big">{weather.temp_c != null ? `${Math.round(weather.temp_c)}°C` : '—'}</div>
              <div className="signal-meta">
                <span className="muted">{weather.description || weather.condition}</span>
                <span style={{ color: severityColor(weather.severity) }}>{weather.severity || 'calm'}</span>
              </div>
            </>
          ) : (
            <div className="muted" style={{ fontSize: '0.8rem' }}>unavailable</div>
          )}
        </div>
      </div>

      <div className="card signals-news">
        <div className="signal-head">
          <span className="card-title">News Signals</span>
          <SourceBadge source={news?.source} />
        </div>
        {newsLoading ? (
          <div className="muted" style={{ fontSize: '0.85rem', padding: '8px 0' }}>Loading headlines…</div>
        ) : news?.headlines?.length ? (
          <div className="news-list">
            {news.headlines.slice(0, 6).map((h, i) => (
              <a
                key={`${h.link}-${i}`}
                className="news-item"
                href={h.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="news-title">{h.title}</div>
                <div className="news-meta muted">
                  {h.source}{h.published_at ? ` · ${timeAgo(h.published_at)}` : ''}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="muted" style={{ fontSize: '0.85rem', padding: '8px 0' }}>No headlines available.</div>
        )}
      </div>
    </div>
  );
};

export default SignalsPanel;
