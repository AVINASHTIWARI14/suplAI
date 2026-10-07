import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import BrandLogo from './BrandLogo.jsx';
import userAvatar from '../assets/user-avatar.png';

const TopNav = ({
  companies,
  selectedCompanyId,
  onCompanyChange,
  user,
  logout,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [profileOpen, setProfileOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);

  const isHome = location.pathname === '/';
  const isAuthenticated = Boolean(user);

  const handleProtectedNav = (event, path) => {
    if (isAuthenticated) return;

    event.preventDefault();

    // Already sitting on the signup card: do not navigate or scroll again.
    if (
      location.pathname === '/' &&
      location.hash === '#signup'
    ) {
      return;
    }

    navigate('/#signup');
  };

  const displayName =
    user?.full_name ||
    user?.name ||
    user?.email?.split('@')[0] ||
    'User';

  const displayEmail = user?.email || '';
  const displayRole = user?.role || 'viewer';

  const selectedCompany =
    companies?.find(
      (company) => String(company.id) === String(selectedCompanyId),
    ) || companies?.[0];

  const handleCompanyChange = (companyId) => {
    onCompanyChange(companyId);
    setCompanyOpen(false);
  };

  const handleLogout = () => {
    setProfileOpen(false);
    logout?.();
    navigate('/');
  };

  return (
    <header className="top-nav">
      <div className="top-nav-brand">
        <BrandLogo />
      </div>

      <nav className="header-nav" aria-label="Primary navigation">
        <NavLink
          to="/dashboard"
          onClick={(event) => handleProtectedNav(event, '/dashboard')}
          className={({ isActive }) =>
            `nav-link${isActive ? ' active' : ''}`
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/suppliers"
          onClick={(event) => handleProtectedNav(event, '/suppliers')}
          className={({ isActive }) =>
            `nav-link${isActive ? ' active' : ''}`
          }
        >
          Suppliers
        </NavLink>

        <NavLink
          to="/network"
          onClick={(event) => handleProtectedNav(event, '/network')}
          className={({ isActive }) =>
            `nav-link${isActive ? ' active' : ''}`
          }
        >
          Network
        </NavLink>

        <NavLink
          to="/alternatives"
          onClick={(event) => handleProtectedNav(event, '/alternatives')}
          className={({ isActive }) =>
            `nav-link${isActive ? ' active' : ''}`
          }
        >
          Alternatives
        </NavLink>

        <NavLink
          to="/disruptions"
          onClick={(event) => handleProtectedNav(event, '/disruptions')}
          className={({ isActive }) =>
            `nav-link${isActive ? ' active' : ''}`
          }
        >
          Disruptions
        </NavLink>

        <NavLink
          to="/alerts"
          onClick={(event) => handleProtectedNav(event, '/alerts')}
          className={({ isActive }) =>
            `nav-link${isActive ? ' active' : ''}`
          }
        >
          Alerts
        </NavLink>

        <NavLink
          to="/settings"
          onClick={(event) => handleProtectedNav(event, '/settings')}
          className={({ isActive }) =>
            `nav-link${isActive ? ' active' : ''}`
          }
        >
          Settings
        </NavLink>
      </nav>

      <div className="top-nav-actions">
        {!isHome && (
          <div
            className={`company-dropdown${companyOpen ? ' is-open' : ''}`}
            onMouseEnter={() => setCompanyOpen(true)}
            onMouseLeave={() => setCompanyOpen(false)}
          >
            <button
              type="button"
              className="company-dropdown-selected"
              onClick={() => setCompanyOpen((open) => !open)}
              aria-haspopup="listbox"
              aria-expanded={companyOpen}
              aria-label="Select company"
            >
              <span className="company-dropdown-selected-text">
                {selectedCompany?.name || 'Select company'}
              </span>

              <svg
                className="company-dropdown-arrow"
                viewBox="0 0 25 10"
                aria-hidden="true"
              >
                <path
                  d="M2 2L12.5 8L23 2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div
              className="company-dropdown-options"
              role="listbox"
              aria-label="Companies"
            >
              {companies?.map((company) => {
                const active =
                  String(company.id) === String(selectedCompanyId);

                return (
                  <button
                    key={company.id}
                    type="button"
                    className={`company-dropdown-option${
                      active ? ' selected' : ''
                    }`}
                    onClick={() => handleCompanyChange(company.id)}
                    role="option"
                    aria-selected={active}
                  >
                    {company.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!isAuthenticated ? (
          <button
            type="button"
            className="header-login-button"
            onClick={() => navigate('/#login')}
          >
            Login
          </button>
        ) : (
          <div className="profile-menu">
            <button
              type="button"
              className="profile-trigger profile-trigger-avatar-only"
              onClick={() => setProfileOpen((open) => !open)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              aria-label="Open user menu"
              title="Open user menu"
            >
              <img
                className="profile-avatar profile-avatar-image"
                src={userAvatar}
                alt=""
                aria-hidden="true"
              />
            </button>

            {profileOpen && (
              <div className="profile-dropdown" role="menu">
                <div className="profile-dropdown-header">
                  <img
                    className="profile-avatar profile-avatar-large profile-avatar-image"
                    src={userAvatar}
                    alt=""
                    aria-hidden="true"
                  />

                  <div className="profile-dropdown-info">
                    <strong>{displayName}</strong>
                    <span>{displayEmail}</span>
                    <small>{displayRole}</small>
                  </div>
                </div>

                <div className="profile-dropdown-divider" />

                <button
                  type="button"
                  className="profile-dropdown-item profile-logout button"
                  onClick={handleLogout}
                  role="menuitem"
                >
                  <svg
                    className="svg-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M10 3H6.8A1.8 1.8 0 0 0 5 4.8v14.4A1.8 1.8 0 0 0 6.8 21H10M14 16l4-4-4-4M18 12H9"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <span className="lable">Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default TopNav;
