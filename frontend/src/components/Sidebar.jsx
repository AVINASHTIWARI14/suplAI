import { NavLink } from 'react-router-dom';

const Sidebar = ({ onLogout, user, open, onToggle }) => {

  const items = [
    { to: '/', label: 'Dashboard' },
    { to: '/suppliers', label: 'Supplier Explorer' },
    { to: '/network', label: 'Network & Simulation' },
    { to: '/alternatives', label: 'Alternatives' },
    { to: '/disruptions', label: 'Disruption Feed' },
    { to: '/alerts', label: 'Alerts' },
    { to: '/settings', label: 'Settings' },
  ];

  return (
    <aside className={`sidebar${open ? ' sidebar--open' : ''}`}>
      {/* Hamburger button */}
      {/*
        Fully UNMOUNT the nav when closed. Previously it stayed mounted and was
        hidden only via max-height/opacity, which the mobile media query failed
        to reset — leaving a stray, partially-visible strip. Unmounting leaves
        no stray DOM/height/opacity in any viewport.
      */}
      {open && (
        <nav className="sidebar-nav">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={() => onToggle(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}

      {open && user && (
        <button type="button" className="sidebar-logout logout-button" onClick={onLogout}>Logout</button>
      )}
    </aside>
  );
};

export default Sidebar;
