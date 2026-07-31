import { useEffect, useState, useCallback } from 'react';
import RiskBadge from './RiskBadge.jsx';
import { fetchAlerts, markAlertRead } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { timeAgo } from '../utils/dates.js';

/** Slide-out alerts/notifications panel. Fully unmounts when closed. */
const NotificationsPanel = ({ companyId, onClose }) => {
  const { canEdit } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchAlerts(companyId)
      .then((data) => setAlerts(Array.isArray(data) ? data : []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onMarkRead = async (id) => {
    try {
      await markAlertRead(id);
    } finally {
      load();
    }
  };

  const unread = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="drawer-overlay" role="presentation" onClick={onClose}>
      <aside className="drawer-panel" role="dialog" aria-label="Notifications" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <div className="drawer-title">Notifications</div>
            <div className="muted" style={{ fontSize: '0.75rem' }}>{unread} unread</div>
          </div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="drawer-body">
          {loading ? (
            <div className="empty-state">Loading alerts…</div>
          ) : alerts.length ? (
            alerts.map((alert) => (
              <div key={alert.id} className={`notif-item${alert.is_read ? ' read' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{alert.title}</div>
                  <RiskBadge score={0} severity={alert.severity?.toLowerCase() || 'high'} />
                </div>
                <div className="muted" style={{ fontSize: '0.82rem', marginTop: 4 }}>{alert.message}</div>
                <div className="notif-foot">
                  <span className="muted" style={{ fontSize: '0.72rem' }}>{timeAgo(alert.created_at || alert.start_date)}</span>
                  {canEdit && !alert.is_read && !String(alert.id).startsWith('computed-') && (
                    <button type="button" className="link-btn" onClick={() => onMarkRead(alert.id)}>
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">No alerts — risk levels look stable.</div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default NotificationsPanel;
