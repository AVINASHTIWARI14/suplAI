import { useState } from 'react';
import NotificationsPanel from './NotificationsPanel.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const TopNav = ({ companies, selectedCompanyId, onCompanyChange, companyName, user, apiOnline }) => {
  const { logout, isAuthenticated, role } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const initials = (user?.full_name || 'G')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header className="top-nav">
        <div className="top-nav-brand">
          <div className="logo"><span className="logo-supl">Supl</span><span className="logo-ai">AI</span></div>
          <span className="logo-tag">RISK TERMINAL</span>
        </div>

        <div className="top-nav-actions">
          <span className={`api-pill ${apiOnline ? 'online' : 'offline'}`}>
            {apiOnline ? '● DB connected' : '○ Backend offline'}
          </span>

          <select
            className="company-select"
            value={selectedCompanyId}
            onChange={(e) => onCompanyChange(e.target.value)}
            aria-label="Select company"
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>

          {isAuthenticated && (
            <button
              type="button"
              className="icon-btn bell-btn"
              onClick={() => setNotifOpen(true)}
              aria-label="Open notifications"
              title="Notifications"
            >
              🔔
            </button>
          )}

          {isAuthenticated ? (
            <>
              <div className="user-chip">
                <div className="user-avatar">{initials}</div>
                <div className="user-meta">
                  <div className="name">{user?.full_name}</div>
                  <div className="role">
                    <span className={`role-tag ${role === 'admin' ? 'admin' : 'viewer'}`}>{role || 'viewer'}</span>
                    <span> · {companyName}</span>
                  </div>
                </div>
              </div>
              <button type="button" className="btn-header" onClick={logout}>
                Logout
              </button>
            </>
          ) : null}
        </div>
      </header>

      {notifOpen && isAuthenticated && (
        <NotificationsPanel companyId={selectedCompanyId} onClose={() => setNotifOpen(false)} />
      )}
    </>
  );
};

export default TopNav;
