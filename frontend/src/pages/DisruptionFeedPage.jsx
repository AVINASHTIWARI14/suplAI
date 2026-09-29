import { useEffect, useState } from 'react';

import DisruptionCard from '../components/DisruptionCard.jsx';
import SignalsPanel from '../components/SignalsPanel.jsx';

import { fetchActiveDisruptions } from '../api/client.js';

const DisruptionFeedPage = ({ company }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);

    fetchActiveDisruptions()
      .then((data) => setEvents(data || []))
      .catch((err) => setError(err.message || 'Failed to load disruptions'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="disruption-feed-page">

      {/* SIGNALS */}
      <div className="signals-panel-card">
        <SignalsPanel company={company} />
      </div>

      {/* DISRUPTION CARDS */}
      <section className="disruption-cards-section">

        {loading && (
          <div className="card loading-state">
            Loading disruption feed…
          </div>
        )}

        {error && (
          <div className="card error-state">
            {error}
          </div>
        )}

        {!loading && !error && (
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
        )}

      </section>

    </div>
  );
};

export default DisruptionFeedPage;