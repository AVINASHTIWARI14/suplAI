import { useEffect, useMemo, useState } from 'react';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { LanguageProvider, useLanguage } from './context/LanguageContext.jsx';

import Home from './pages/Home.jsx';

import DashboardPage from './pages/DashboardPage.jsx';

import SupplierExplorerPage from './pages/SupplierExplorerPage.jsx';

import NetworkPage from './pages/NetworkPage.jsx';

import AlternativesPage from './pages/AlternativesPage.jsx';

import DisruptionFeedPage from './pages/DisruptionFeedPage.jsx';

import AlertsPage from './pages/AlertsPage.jsx';

import SettingsPage from './pages/SettingsPage.jsx';

import TopNav from './components/TopNav.jsx';

import companiesFallback from './data/companies.js';

import { fetchCompanies } from './api/client.js';

import { checkBackendHealth } from './api.js';


function AppShell() {

  const { user, logout } = useAuth();
  const { translate } = useLanguage();

  const [companies, setCompanies] = useState(companiesFallback);

  const [companyId, setCompanyId] = useState(companiesFallback[0].id);

  const [overallRisk, setOverallRisk] = useState(0);

  const [apiOnline, setApiOnline] = useState(false);

  const [apiError, setApiError] = useState(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  useEffect(() => {
    if (!privacyOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setPrivacyOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [privacyOpen]);


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


          const preferred =

            user?.company_id &&

            list.find((c) => c.id === user.company_id);


          setCompanyId((current) => {

            if (list.some((c) => c.id === current)) {

              return current;

            }

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


  const company = useMemo(

    () => companies.find((c) => c.id === companyId),

    [companies, companyId],

  );


  const companyName = company?.name ?? 'Company';


  const privacyStyles = `
    .privacy-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 3000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(7, 24, 44, 0.56);
      backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
    }

    .privacy-modal {
      width: min(820px, calc(100vw - 32px));
      max-height: min(78vh, 720px);
      overflow: hidden;
      border: none;
      border-radius: 22px;
      background: #F4C400;
      color: #183153;
      box-shadow: none;
      text-shadow: none;
      filter: none;
    }

    .privacy-modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 18px;
      padding: 24px 26px 18px;
      border-bottom: none;
    }

    .privacy-modal h2 {
      margin: 0;
      color: #183153;
      font-size: clamp(1.7rem, 3vw, 2.25rem);
      font-weight: 900;
      line-height: 1.05;
    }

    .privacy-modal-content {
      max-height: calc(min(78vh, 720px) - 102px);
      overflow-y: auto;
      padding: 22px 26px 26px;
      scrollbar-width: thin;
    }

    .privacy-modal-content p {
      margin: 0 0 15px;
      color: #183153;
      font-size: 0.97rem;
      font-weight: 500;
      line-height: 1.65;
    }

    .privacy-modal-content h3 {
      margin: 20px 0 7px;
      color: #183153;
      font-size: 1rem;
      font-weight: 900;
    }

    .privacy-demo-note {
      display: flex;
      flex-direction: column;
      gap: 5px;
      margin: 18px 0 6px;
      padding: 14px 16px;
      border: none;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.28);
      color: #183153;
      box-shadow: none;
    }

    .privacy-demo-note strong {
      font-size: 0.92rem;
      font-weight: 900;
    }

    .privacy-demo-note span {
      font-size: 0.9rem;
      line-height: 1.55;
    }

    .privacy-modal-footer-note {
      margin-top: 22px !important;
      padding-top: 14px;
      border-top: none;
      font-weight: 800 !important;
    }

    .site-footer-privacy {
      appearance: none !important;
      -webkit-appearance: none !important;
      border: 0 !important;
      background: transparent !important;
      background-image: none !important;
      font: inherit;
      cursor: pointer;
      padding: 0;
      margin: 0;
      box-shadow: none !important;
      text-shadow: none !important;
      filter: none !important;
      transform: none !important;
    }

    .site-footer-privacy:hover,
    .site-footer-privacy:focus-visible,
    .site-footer-privacy:active {
      background: transparent !important;
      background-image: none !important;
      box-shadow: none !important;
      text-shadow: none !important;
      filter: none !important;
      transform: none !important;
      outline: none;
    }

    @media (max-width: 700px) {
      .privacy-modal-backdrop {
        padding: 12px;
      }

      .privacy-modal {
        width: min(100%, 760px);
        max-height: 84vh;
        border-radius: 18px;
      }

      .privacy-modal-header {
        padding: 19px 18px 14px;
      }

      .privacy-modal-content {
        max-height: calc(84vh - 83px);
        padding: 17px 18px 21px;
      }
    }
  `;

  return (

    <>

      <style>{privacyStyles}</style>

      <div className="app-shell">

      <div className="main-content">

        <TopNav

          companies={companies}

          selectedCompanyId={companyId}

          onCompanyChange={setCompanyId}

          companyName={companyName}

          user={user}

          logout={logout}

          apiOnline={apiOnline}

        />


        {apiError && !apiOnline && (

          <div className="banner-error">

            {apiError}

          </div>

        )}


        <div className="route-content">

        <Routes>

          {/* HOME PAGE */}

          <Route

            path="/"

            element={<Home />}

          />


          {/* DASHBOARD */}

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


          {/* SUPPLIERS */}

          <Route

            path="/suppliers"

            element={

              <SupplierExplorerPage

                companyId={companyId}

              />

            }

          />


          {/* NETWORK */}

          <Route

            path="/network"

            element={

              <NetworkPage

                companyId={companyId}

              />

            }

          />


          {/* ALTERNATIVES */}

          <Route

            path="/alternatives"

            element={

              <AlternativesPage

                companyId={companyId}

              />

            }

          />


          {/* DISRUPTIONS */}

          <Route

            path="/disruptions"

            element={

              <DisruptionFeedPage

                company={company}

              />

            }

          />


          {/* ALERTS */}

          <Route

            path="/alerts"

            element={

              <AlertsPage

                companyId={companyId}

              />

            }

          />


          {/* SETTINGS */}

          <Route

            path="/settings"

            element={

              <SettingsPage

                companyId={companyId}

                companyName={companyName}

              />

            }

          />


          {/* FALLBACK */}

          <Route

            path="*"

            element={<Navigate to="/" replace />}

          />

        </Routes>

        </div>

        <footer className="site-footer">

          <span className="site-footer-demo">

            Demo-Synthetic Data

          </span>

          <button

            type="button"

            className="site-footer-privacy"

            onClick={() => setPrivacyOpen(true)}

          >

            Privacy Policy

          </button>


          <div

            className="site-footer-socials"

            aria-label="Social links"

          >

            <a

              className="social-linkedin"

              href="https://www.linkedin.com/in/avinash-tiwari-95b5932a6"

              target="_blank"

              rel="noreferrer"

              aria-label="LinkedIn"

              title="LinkedIn"

            >

              <svg

                viewBox="0 0 24 24"

                aria-hidden="true"

              >

                <path d="M6.5 8.5H3V21h3.5V8.5ZM4.75 3A2.05 2.05 0 1 0 4.75 7.1 2.05 2.05 0 0 0 4.75 3ZM21 13.85C21 10.1 18.99 8.1 16.3 8.1c-2.2 0-3.18 1.21-3.73 2.06V8.5H9.08V21h3.49v-6.18c0-1.63.31-3.2 2.32-3.2 1.98 0 2.01 1.85 2.01 3.31V21H21v-7.15Z" />

              </svg>

            </a>


            <a

              className="social-github"

              href="https://github.com/AVINASHTIWARI14"

              target="_blank"

              rel="noreferrer"

              aria-label="GitHub"

              title="GitHub"

            >

              <svg

                viewBox="0 0 24 24"

                aria-hidden="true"

              >

                <path d="M12 2.5a9.5 9.5 0 0 0-3 18.51c.48.09.65-.21.65-.46v-1.7c-2.65.58-3.21-1.12-3.21-1.12-.44-1.1-1.07-1.39-1.07-1.39-.87-.6.07-.59.07-.59.96.07 1.47.99 1.47.99.86 1.47 2.25 1.04 2.8.8.09-.63.34-1.04.61-1.28-2.12-.24-4.35-1.06-4.35-4.72 0-1.04.37-1.89.98-2.55-.1-.24-.43-1.21.09-2.52 0 0 .8-.26 2.62.98A9.1 9.1 0 0 1 12 7.1c.81 0 1.62.11 2.38.35 1.82-1.24 2.62-.98 2.62-.98.52 1.31.19 2.28.09 2.52.61.66.98 1.51.98 2.55 0 3.67-2.23 4.48-4.36 4.71.35.3.65.88.65 1.78v2.64c0 .26.17.56.66.46A9.5 9.5 0 0 0 12 2.5Z" />

              </svg>

            </a>


            <a

              className="social-instagram"

              href="https://www.instagram.com/vesper.commw?igsi=OWR0cDlkNWx0NHhm"

              target="_blank"

              rel="noreferrer"

              aria-label="Instagram"

              title="Instagram"

            >

              <svg

                viewBox="0 0 24 24"

                aria-hidden="true"

              >

                <path d="M7.2 2.5h9.6A4.7 4.7 0 0 1 21.5 7.2v9.6a4.7 4.7 0 0 1-4.7 4.7H7.2a4.7 4.7 0 0 1-4.7-4.7V7.2a4.7 4.7 0 0 1 4.7-4.7Zm-.1 1.8a2.8 2.8 0 0 0-2.8 2.8v9.8a2.8 2.8 0 0 0 2.8 2.8h9.8a2.8 2.8 0 0 0 2.8-2.8V7.1a2.8 2.8 0 0 0-2.8-2.8H7.1Zm9.95 1.35a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z" />

              </svg>

            </a>

          </div>

        </footer>

      </div>


        {privacyOpen && (

          <div

            className="privacy-modal-backdrop"

            role="presentation"

            onClick={() => setPrivacyOpen(false)}

          >

            <section

              className="privacy-modal"

              role="dialog"

              aria-modal="true"

              aria-labelledby="privacy-modal-title"

              onClick={(event) => event.stopPropagation()}

            >

              <div className="privacy-modal-header">

                <div>

                  <h2 id="privacy-modal-title">Privacy Policy</h2>

                </div>

              </div>

              <div className="privacy-modal-content">

                <p>

                  This Privacy Policy explains how the public demo version of
                  SuplAI handles information while you use the application.
                </p>

                <div className="privacy-demo-note">

                  <strong>Demo-Synthetic Data</strong>
                  <span>
                    The supplier, company, risk, disruption and network data
                    shown in this public demo is synthetic and is intended for
                    demonstration and testing purposes. It is not presented
                    as live information about real companies or suppliers.
                  </span>

                </div>

                <h3>Information we may process</h3>
                <p>
                  Depending on the features you use, the application may
                  process your account details, selected company information,
                  application activity and data required to provide risk,
                  network and reporting features.
                </p>

                <h3>Authentication</h3>
                <p>
                  When authentication is enabled, account and session
                  information is handled through the application's
                  authentication services. Access tokens are used to keep you
                  signed in and to authorize requests to the application.
                </p>

                <h3>Application data</h3>
                <p>
                  The demo uses synthetic records to demonstrate supplier
                  risk scoring, dependency mapping, disruption signals,
                  alternatives and alerts. Demo records should not be used as
                  a basis for real operational or commercial decisions.
                </p>

                <h3>Third-party services</h3>
                <p>
                  SuplAI may connect to services such as Supabase and other
                  configured APIs to provide authentication, data storage or
                  external signals. Those services may process information in
                  accordance with their own policies and terms.
                </p>

                <h3>Local storage</h3>
                <p>
                  The browser may store authentication tokens or preferences
                  needed for the application to function. Clearing browser
                  storage can sign you out or reset local application state.
                </p>

                <h3>Security</h3>
                <p>
                  The application is designed to keep server-side credentials
                  separate from the browser client. Do not enter confidential
                  business information, credentials, financial information or
                  other sensitive data into this public demonstration.
                </p>

                <h3>Policy updates</h3>
                <p>
                  This notice may be updated as the demo evolves. The version
                  shown here is intended to describe the current public demo
                  behaviour.
                </p>

                <p className="privacy-modal-footer-note">
                  By continuing to use this demo, you acknowledge that you are
                  using a demonstration application with synthetic data.
                </p>

              </div>

            </section>

          </div>

        )}

      </div>

    </>

  );

}


function App() {

  return (

    <BrowserRouter>

      <LanguageProvider>

        <AuthProvider>

          <Routes>

            <Route

              path="/*"

              element={<AppShell />}

            />

          </Routes>

        </AuthProvider>

      </LanguageProvider>

    </BrowserRouter>

  );

}


export default App;