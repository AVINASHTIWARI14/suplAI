import { useEffect, useState } from 'react';
import RiskBadge from '../components/RiskBadge.jsx';
import { fetchAlerts, markAlertRead } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const AlertsPage = ({ companyId }) => {
  const { canEdit } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchAlerts(companyId)
      .then(setAlerts)
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [companyId]);

  const onMarkRead = async (id) => {
    await markAlertRead(id);
    load();
  };

  return (
    <div className="page-body">
      <div>
        <h1 style={{ margin: 0 }}>Alerts</h1>
        <p style={{ color: '#8b9bb4' }}>Early warnings when supplier or network risk is high — act before damage.</p>
      </div>

      {loading ? (
        <div className="card loading-state">Loading alerts…</div>
      ) : alerts.length ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {alerts.map((alert) => (
            <div key={alert.id} className="card" style={{ opacity: alert.is_read ? 0.65 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{alert.title}</div>
                  <div style={{ color: '#94a3b8', marginTop: 6, fontSize: '0.9rem' }}>{alert.message}</div>
                </div>
                <RiskBadge score={0} severity={alert.severity?.toLowerCase() || 'high'} />
              </div>
              {canEdit && !alert.is_read && !String(alert.id).startsWith('computed-') && (
                <button type="button" className="btn-ghost" style={{ marginTop: 12 }} onClick={() => onMarkRead(alert.id)}>
                  Mark as read
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card empty-state">No alerts — risk levels look stable for this company.</div>
      )}
    </div>
  );
};

export default AlertsPage;
