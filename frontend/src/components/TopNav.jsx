import { useState } from 'react';
import NotificationsPanel from './NotificationsPanel.jsx';
import AuthModal from './AuthModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const TopNav = ({ companies, selectedCompanyId, onCompanyChange, companyName, user, apiOnline, sidebarOpen, onToggleSidebar }) => {
  const { logout, isAuthenticated, role } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
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
          <div className="logo-text" aria-label="SuplAI"><span>Supl</span><span className="logo-ai-text">AI<span className="logo-dot">.</span></span></div>
        </div>

        <div className="top-nav-actions">
          <button
            type="button"
            className={`hamburger-btn${sidebarOpen ? ' open' : ''}`}
            onClick={onToggleSidebar}
            aria-label="Toggle navigation"
            aria-expanded={sidebarOpen}
          >
            <span />
            <span />
            <span />
          </button>
          <select
            className="company-select header-company-select"
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

          <button type="button" className="header-login-button" onClick={() => { setAuthMode('login'); setLoginOpen(true); }}>
            Login
          </button>

          {isAuthenticated && (
            <button
              type="button"
              className="icon-btn bell-btn"
              onClick={() => setNotifOpen(true)}
              aria-label="Open notifications"
              title="Notifications"
            >
              <span aria-hidden="true">!</span>
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
              <button type="button" className="btn-header logout-button" onClick={logout}>
                Logout
              </button>
            </>
          ) : null}
        </div>
      </header>

      {notifOpen && isAuthenticated && (
        <NotificationsPanel companyId={selectedCompanyId} onClose={() => setNotifOpen(false)} />
      )}
      {loginOpen && (
        <AuthModal mode={authMode} onClose={() => setLoginOpen(false)} onSwitchMode={setAuthMode} />
      )}
    </>
  );
};

export default TopNav;
