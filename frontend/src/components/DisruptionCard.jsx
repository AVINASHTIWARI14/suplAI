import RiskBadge from './RiskBadge.jsx';
import { severityFromEvent } from '../utils/risk.js';
import { formatDate, timeAgo } from '../utils/dates.js';

const DisruptionCard = ({ event }) => {
  const severity = severityFromEvent(event);

  return (
    <article className="card disruption-feed-card">
      <div className="disruption-feed-content">
        <div className="disruption-feed-main">
          <div className="disruption-feed-title-row">
            <div className="disruption-feed-title">{event.event_type || 'Supply disruption'}</div>
            <RiskBadge score={0} severity={severity} />
          </div>
          <div className="disruption-feed-location">
            {event.location || 'Unknown'}{event.country ? `, ${event.country}` : ''}
          </div>
          <div className="disruption-feed-industry">
            {event.affected_industry || 'General manufacturing'}
          </div>
          <div className="disruption-feed-date">
            {formatDate(event.start_date)} · {timeAgo(event.start_date)}
          </div>
        </div>
      </div>
    </article>
  );
};

export default DisruptionCard;
