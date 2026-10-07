import { useEffect, useState } from 'react';

import DisruptionCard from '../components/DisruptionCard.jsx';
import SignalsPanel from '../components/SignalsPanel.jsx';

import { fetchActiveDisruptions } from '../api/client.js';

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
import fxBackground from '../assets/signals/fx-background.jpg';
import weatherBackground from '../assets/signals/weather-background.jpg';

const DisruptionFeedPage = ({ company }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchActiveDisruptions()
      .then((data) => setEvents(data || []))
      .catch((err) => setError(err.message || 'Failed to load disruptions'))
      .finally(() => setLoading(false));
  }, []);

  /*
   * Weather illustration: decorate the existing Weather signal card with
   * the matching uploaded icon. The selection follows the weather text
   * already rendered by SignalsPanel, so the displayed image changes with
   * the predicted/current condition without changing the API contract.
   */
  useEffect(() => {
    if (loading || error) return undefined;

    const page = document.querySelector('.disruption-feed-page');
    if (!page) return undefined;

    const weatherImages = {
      clear: clearWeather,
      partlyCloudy: partlyCloudyWeather,
      cloudy: cloudyWeather,
      lightRain: lightRainWeather,
      rain: rainWeather,
      thunderstorm: thunderstormWeather,
      snow: snowWeather,
      sleet: sleetWeather,
      tornado: tornadoWeather,
      fog: fogWeather,
      windy: windyWeather,
      haze: hazeWeather,
    };

    const getWeatherImage = (text) => {
      const t = (text || '').toLowerCase();

      if (/tornado|funnel|waterspout/.test(t)) return weatherImages.tornado;
      if (/thunder|lightning|storm/.test(t)) return weatherImages.thunderstorm;
      if (/sleet|freezing rain|wintry mix|ice pellets/.test(t)) return weatherImages.sleet;
      if (/snow|blizzard|snowfall/.test(t)) return weatherImages.snow;
      if (/fog|mist/.test(t)) return weatherImages.fog;
      if (/haze|dust|smoke|sand/.test(t)) return weatherImages.haze;
      if (/wind|gale|strong breeze/.test(t)) return weatherImages.windy;
      if (/drizzle/.test(t)) return weatherImages.lightRain;
      if (/heavy rain|downpour|pouring|shower/.test(t)) return weatherImages.rain;
      if (/light rain/.test(t)) return weatherImages.lightRain;
      if (/rain/.test(t)) return weatherImages.rain;
      if (/partly cloudy|partly cloud|few clouds|scattered clouds/.test(t)) return weatherImages.partlyCloudy;
      if (/overcast|mostly cloudy|cloudy|broken clouds/.test(t)) return weatherImages.cloudy;
      if (/clear|sunny/.test(t)) return weatherImages.clear;

      return weatherImages.cloudy;
    };

    const decorateWeatherCard = () => {
      const cards = Array.from(
        page.querySelectorAll('.signals-indicators > .signal-card')
      );

      if (!cards.length) return;

      let weatherCard = cards.find((card) => {
        const text = (card.textContent || '').toLowerCase();
        return /weather|temperature|temp|condition/.test(text);
      });

      if (!weatherCard) weatherCard = cards[1] || null;
      if (!weatherCard) return;

      const fxCard = cards.find((card) => {
        const text = (card.textContent || '').toLowerCase();
        return /fx|forex|currency|exchange|rate|volatility/.test(text);
      }) || cards[0] || null;

      if (fxCard) {
        fxCard.classList.add('fx-signal-card');
        fxCard.style.setProperty('--signal-bg-image', `url("${fxBackground}")`);
      }

      weatherCard.classList.add('weather-signal-card');
      weatherCard.style.setProperty(
        '--signal-bg-image',
        `url("${weatherBackground}")`,
      );

      let imageWrap = weatherCard.querySelector('.weather-signal-image-wrap');
      if (!imageWrap) {
        imageWrap = document.createElement('div');
        imageWrap.className = 'weather-signal-image-wrap';

        const image = document.createElement('img');
        image.className = 'weather-signal-image';
        image.alt = 'Current weather condition';
        imageWrap.appendChild(image);
        weatherCard.appendChild(imageWrap);
      }

      // Remove the visible severity label (for example, "low") from the
      // weather card while keeping the actual weather data intact.
      const severityValues = new Set(['low', 'medium', 'high']);
      weatherCard.querySelectorAll('*').forEach((element) => {
        if (element.children.length !== 0) return;
        const value = (element.textContent || '').trim().toLowerCase();
        if (severityValues.has(value)) {
          element.style.display = 'none';
        }
      });

      const image = imageWrap.querySelector('.weather-signal-image');
      if (image) {
        const src = getWeatherImage(weatherCard.textContent);
        if (image.src !== new URL(src, window.location.href).href) {
          image.src = src;
        }
      }
    };

    const observer = new MutationObserver(decorateWeatherCard);
    observer.observe(page, { childList: true, subtree: true, characterData: true });
    decorateWeatherCard();

    return () => observer.disconnect();
  }, [loading, error]);

  return (
    <div className="disruption-feed-page">
      {loading ? (
        <div className="disruption-loading-state" aria-label="Loading disruptions">
          <div className="dashboard-loading-spinner" aria-hidden="true" />
        </div>
      ) : error ? (
        <section className="disruption-cards-section">
          <div className="card error-state">
            {error}
          </div>
        </section>
      ) : (
        <>
          {/* SIGNALS */}
          <div className="signals-panel-card">
            <SignalsPanel company={company} />
          </div>

          {/* DISRUPTION CARDS */}
          <section className="disruption-cards-section">
            <div className="feed-grid">
              {events.length ? (
                events.map((event) => (
                  <DisruptionCard
                    key={event.id}
                    event={event}
                  />
                ))
              ) : (
                <div className="card empty-state">
                  No active disruptions.
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default DisruptionFeedPage;
