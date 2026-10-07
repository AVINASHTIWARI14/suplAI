import { useEffect, useState } from 'react';
import SourceBadge from './SourceBadge.jsx';
import { fetchNews, fetchFx, fetchWeather } from '../api/client.js';
import { timeAgo } from '../utils/dates.js';
import clearWeather from '../assets/weather/clear.png';
import partlyCloudyWeather from '../assets/weather/partly-cloudy.png';
import cloudyWeather from '../assets/weather/cloudy.png';
import lightRainWeather from '../assets/weather/light-rain.png';
import rainWeather from '../assets/weather/rain.png';
import thunderstormWeather from '../assets/weather/thunderstorm.png';
import snowWeather from '../assets/weather/snow.png';
import sleetWeather from '../assets/weather/sleet.png';
import tornadoWeather from '../assets/weather/tornado.png';
import fogWeather from '../assets/weather/fog.png';
import windyWeather from '../assets/weather/windy.png';
import hazeWeather from '../assets/weather/haze.png';

const FALLBACK_HEADLINES = [
  {
    title: 'Port congestion delays shipments at major Asian hub',
    source: 'SuplAI Demo',
    keywords: ['port', 'logistics'],
  },
  {
    title: 'Factory fire disrupts electronics component supply',
    source: 'SuplAI Demo',
    keywords: ['factory fire'],
  },
  {
    title: 'Regional strike affects freight movement',
    source: 'SuplAI Demo',
    keywords: ['strike', 'labour'],
  },
  {
    title: 'Semiconductor lead times rise across East Asian supply routes',
    source: 'SuplAI Demo',
    keywords: ['semiconductor', 'lead time'],
  },
  {
    title: 'Container capacity tightens on major Europe-Asia corridor',
    source: 'SuplAI Demo',
    keywords: ['containers', 'shipping'],
  },
  {
    title: 'Extreme weather adds pressure to regional freight networks',
    source: 'SuplAI Demo',
    keywords: ['weather', 'freight'],
  },
];

const getWeatherImage = (text = '') => {
  const t = text.toLowerCase();

  if (/tornado|funnel|waterspout/.test(t)) return tornadoWeather;
  if (/thunder|lightning|storm/.test(t)) return thunderstormWeather;
  if (/sleet|freezing rain|wintry mix|ice pellets/.test(t)) return sleetWeather;
  if (/snow|blizzard|snowfall/.test(t)) return snowWeather;
  if (/fog|mist/.test(t)) return fogWeather;
  if (/haze|dust|smoke|sand/.test(t)) return hazeWeather;
  if (/wind|gale|strong breeze/.test(t)) return windyWeather;
  if (/drizzle/.test(t)) return lightRainWeather;
  if (/heavy rain|downpour|pouring|shower/.test(t)) return rainWeather;
  if (/light rain/.test(t)) return lightRainWeather;
  if (/rain/.test(t)) return rainWeather;
  if (/partly cloudy|partly cloud|few clouds|scattered clouds/.test(t)) return partlyCloudyWeather;
  if (/overcast|mostly cloudy|cloudy|broken clouds/.test(t)) return cloudyWeather;
  if (/clear|sunny/.test(t)) return clearWeather;

  return cloudyWeather;
};

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
  const baseHeadlines =
    news?.headlines?.slice(0, 6)?.length
      ? news.headlines.slice(0, 6)
      : FALLBACK_HEADLINES;

  const marqueeHeadlines = Array.from(
    { length: Math.max(baseHeadlines.length * 2, 6) },
    (_, i) => baseHeadlines[i % baseHeadlines.length],
  );

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
              <div className="weather-signal-image-wrap" aria-hidden="true">
                <img
                  className="weather-signal-image"
                  src={getWeatherImage(weather.description || weather.condition || '')}
                  alt=""
                />
              </div>
            </>
          ) : (
            <div className="muted" style={{ fontSize: '0.8rem' }}>unavailable</div>
          )}
        </div>
      </div>

      <div className="card signals-news">
        <div className="signal-head">
          <span className="card-title news-strip-title">NEWS</span>
          <SourceBadge source={news?.source} />
        </div>
        {newsLoading ? (
          <div className="muted" style={{ fontSize: '0.85rem', padding: '8px 0' }}>Loading headlines…</div>
        ) : (
          <div className="news-list news-marquee-list">
            <div className="news-marquee-track">
              <div className="news-marquee-group">
                {marqueeHeadlines.map((h, i) => (
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

              <div className="news-marquee-group news-marquee-group--clone" aria-hidden="true">
                {marqueeHeadlines.map((h, i) => (
                  <a
                    key={`${h.link}-clone-${i}`}
                    className="news-item"
                    href={h.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={-1}
                  >
                    <div className="news-title">{h.title}</div>
                    <div className="news-meta muted">
                      {h.source}{h.published_at ? ` · ${timeAgo(h.published_at)}` : ''}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignalsPanel;
