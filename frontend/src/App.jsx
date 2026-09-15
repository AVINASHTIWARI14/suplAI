import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import SupplierExplorerPage from './pages/SupplierExplorerPage.jsx';
import NetworkPage from './pages/NetworkPage.jsx';
import AlternativesPage from './pages/AlternativesPage.jsx';
import DisruptionFeedPage from './pages/DisruptionFeedPage.jsx';
import AlertsPage from './pages/AlertsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import Home from './pages/Home.jsx';
import TopNav from './components/TopNav.jsx';
import BrandLogo from './components/BrandLogo.jsx';
import companiesFallback from './data/companies.js';
import { fetchCompanies } from './api/client.js';
import { checkBackendHealth } from './api.js';

function AppShell() {
  const { user, logout } = useAuth();
  const [companies, setCompanies] = useState(companiesFallback);
  const [companyId, setCompanyId] = useState(companiesFallback[0].id);
  const [overallRisk, setOverallRisk] = useState(0);
  const [apiOnline, setApiOnline] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    checkBackendHealth().then(setApiOnline);
    const interval = setInterval(() => {
      checkBackendHealth().then(setApiOnline);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchCompanies()
      .then((list) => {
        if (list?.length) {
          setCompanies(list);
          setApiError(null);
          const preferred = user?.company_id && list.find((c) => c.id === user.company_id);
          setCompanyId((current) => {
            if (list.some((c) => c.id === current)) return current;
            return preferred ? preferred.id : list[0].id;
          });
        }
      })
      .catch(() => {
        setApiError(
          'Cannot load companies from Supabase. Start backend: python -m uvicorn main:app --port 8000 --reload',
        );
      });
  }, [user?.company_id]);

  const company = useMemo(() => companies.find((c) => c.id === companyId), [companies, companyId]);
  const companyName = company?.name ?? 'Company';

  return (
    <div className="app-shell">
      <div className="main-content">
        <TopNav
          companies={companies}
          selectedCompanyId={companyId}
          onCompanyChange={setCompanyId}
          companyName={companyName}
          user={user}
          apiOnline={apiOnline}
        />
        {apiError && !apiOnline && (
          <div className="banner-error">
            {apiError}
          </div>
        )}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/dashboard"
            element={
              <DashboardPage
                companyId={companyId}
                company={company}
                onRiskChange={setOverallRisk}
                apiOnline={apiOnline}
              />
            }
          />
          <Route path="/suppliers" element={<SupplierExplorerPage companyId={companyId} />} />
          <Route path="/network" element={<NetworkPage companyId={companyId} />} />
          <Route path="/alternatives" element={<AlternativesPage companyId={companyId} />} />
          <Route path="/disruptions" element={<DisruptionFeedPage company={company} />} />
          <Route path="/alerts" element={<AlertsPage companyId={companyId} />} />
          <Route path="/settings" element={<SettingsPage companyId={companyId} companyName={companyName} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <footer className="site-footer">
          <BrandLogo variant="footer" />
          <a href="#privacy">Privacy Policy</a>
          <div className="site-footer-socials" aria-label="Social links">
            <a className="social-linkedin" href="https://www.linkedin.com/in/avinash-tiwari-95b5932a6" target="_blank" rel="noreferrer" aria-label="LinkedIn" title="LinkedIn">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 8.5H3V21h3.5V8.5ZM4.75 3A2.05 2.05 0 1 0 4.75 7.1 2.05 2.05 0 0 0 4.75 3ZM21 13.85C21 10.1 18.99 8.1 16.3 8.1c-2.2 0-3.18 1.21-3.73 2.06V8.5H9.08V21h3.49v-6.18c0-1.63.31-3.2 2.32-3.2 1.98 0 2.01 1.85 2.01 3.31V21H21v-7.15Z" /></svg>
            </a>
            <a className="social-github" href="https://github.com/AVINASHTIWARI14" target="_blank" rel="noreferrer" aria-label="GitHub" title="GitHub">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5a9.5 9.5 0 0 0-3 18.51c.48.09.65-.21.65-.46v-1.7c-2.65.58-3.21-1.12-3.21-1.12-.44-1.1-1.07-1.39-1.07-1.39-.87-.6.07-.59.07-.59.96.07 1.47.99 1.47.99.86 1.47 2.25 1.04 2.8.8.09-.63.34-1.04.61-1.28-2.12-.24-4.35-1.06-4.35-4.72 0-1.04.37-1.89.98-2.55-.1-.24-.43-1.21.09-2.52 0 0 .8-.26 2.62.98A9.1 9.1 0 0 1 12 7.1c.81 0 1.62.11 2.38.35 1.82-1.24 2.62-.98 2.62-.98.52 1.31.19 2.28.09 2.52.61.66.98 1.51.98 2.55 0 3.67-2.23 4.48-4.36 4.71.35.3.65.88.65 1.78v2.64c0 .26.17.56.66.46A9.5 9.5 0 0 0 12 2.5Z" /></svg>
            </a>
            <a className="social-instagram" href="https://www.instagram.com/vesper.commw?igsi=OWR0cDlkNWx0NHhm" target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 2.5h9.6A4.7 4.7 0 0 1 21.5 7.2v9.6a4.7 4.7 0 0 1-4.7 4.7H7.2a4.7 4.7 0 0 1-4.7-4.7V7.2a4.7 4.7 0 0 1 4.7-4.7Zm-.1 1.8a2.8 2.8 0 0 0-2.8 2.8v9.8a2.8 2.8 0 0 0 2.8 2.8h9.8a2.8 2.8 0 0 0 2.8-2.8V7.1a2.8 2.8 0 0 0-2.8-2.8H7.1Zm9.95 1.35a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z" /></svg>
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/*"
            element={<AppShell />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
