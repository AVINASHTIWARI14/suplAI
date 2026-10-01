import { useEffect, useState } from 'react';

import RiskBadge from '../components/RiskBadge.jsx';
import { fetchAlerts, markAlertRead } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

import warningIcon from '../assets/warning.png';

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
    <div className="alerts-page">

      {/* HEADER */}
      <div className="alerts-page-header">
        
      </div>

      {/* CONTENT */}
      {loading ? (
        <div
          className="alerts-loading-state"
          aria-label="Loading alerts"
        >
          <div
            className="dashboard-loading-spinner"
            aria-hidden="true"
          />
        </div>
      ) : alerts.length ? (

        <div className="alerts-list">

          {alerts.map((alert) => {

            const severity =
              alert.severity?.toLowerCase() || 'high';

            return (
              <div
                key={alert.id}
                className={`alert-card alert-${severity}`}
                style={{
                  opacity: alert.is_read ? 0.65 : 1,
                }}
              >

                {/* BLURRED WARNING ICON */}
                <img
                  src={warningIcon}
                  alt=""
                  className="alert-warning-watermark"
                />

                {/* LEFT CONTENT */}
                <div className="alert-content">

                  <div className="alert-title">
                    {alert.title}
                  </div>

                  <div className="alert-message">
                    {alert.message}
                  </div>

                </div>

                {/* RIGHT SIDE */}
                <div className="alert-actions">

                  <RiskBadge
                    score={0}
                    severity={severity}
                  />

                  {canEdit &&
                    !alert.is_read &&
                    !String(alert.id).startsWith('computed-') && (
                      <button
                        type="button"
                        className="alert-read-button"
                        onClick={() => onMarkRead(alert.id)}
                      >
                        Mark as read
                      </button>
                    )}

                </div>

              </div>
            );
          })}

        </div>

      ) : (

        <div className="card empty-state">
          No alerts — risk levels look stable for this company.
        </div>

      )}

    </div>
  );
};

export default AlertsPage;