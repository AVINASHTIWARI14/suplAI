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
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import TopNav from './components/TopNav.jsx';
import Sidebar from './components/Sidebar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
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
      <Sidebar riskScore={overallRisk} onLogout={logout} user={user} />
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
          <Route
            path="/"
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
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
