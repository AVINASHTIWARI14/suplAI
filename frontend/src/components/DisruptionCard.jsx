import RiskBadge from './RiskBadge.jsx';
import { severityFromEvent } from '../utils/risk.js';
import { formatDate, timeAgo } from '../utils/dates.js';

const iconForType = (type = '') => {
  const t = type.toLowerCase();
  if (t.includes('port') || t.includes('ship')) return '🚢';
  if (t.includes('factory') || t.includes('plant')) return '🏭';
  if (t.includes('flood') || t.includes('weather')) return '🌊';
  if (t.includes('strike') || t.includes('labor')) return '⚠️';
  return '📰';
};

const DisruptionCard = ({ event }) => {
  const severity = severityFromEvent(event);

  return (
    <article className="card disruption-feed-card">
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div className={`disruption-icon${severity === 'medium' ? ' medium' : ''}`}>{iconForType(event.event_type)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ fontWeight: 700 }}>{event.event_type || 'Supply disruption'}</div>
            <RiskBadge score={0} severity={severity} />
          </div>
          <div style={{ marginTop: 6, color: '#cbd5e1' }}>
            {event.location || 'Unknown'}{event.country ? `, ${event.country}` : ''}
          </div>
          <div style={{ marginTop: 8, fontSize: '0.85rem', color: '#8b9bb4' }}>
            {event.affected_industry || 'General manufacturing'}
          </div>
          <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#64748b' }}>
            {formatDate(event.start_date)} · {timeAgo(event.start_date)}
          </div>
        </div>
      </div>
    </article>
  );
};

export default DisruptionCard;
