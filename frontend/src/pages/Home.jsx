import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import cargoShipHome from '../assets/cargo-ship-home.png';
import freightTruckHome from '../assets/freight-truck-home.png';
import cargoPlaneHome from '../assets/cargo-plane-home.png';

import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { supabase } from '../lib/supabase.js';

const backgroundSlides = [
  cargoShipHome,
  freightTruckHome,
  cargoPlaneHome,
];

const featureCards = [
  {
    title: 'Supplier Risk Intelligence',
    summary: 'Identify suppliers that could put your operations at risk.',
    detail:
      'SuplAI evaluates supplier-level risk and assigns a clear risk score so teams can prioritize vulnerabilities.',
    points: 'Risk Score • Risk Factors • Prioritization',
  },
  {
    title: 'What-If Simulation',
    summary: 'See the impact before a disruption happens.',
    detail:
      'Simulate supplier failures and visualize how disruption propagates across your supply network.',
    points: 'Failure Simulation • Network Impact • Risk Delta',
  },
  {
    title: 'Alternative Suppliers',
    summary: 'Find alternatives when your supply chain is at risk.',
    detail:
      'Compare potential suppliers and identify options that can help maintain supply continuity.',
    points: 'Alternatives • Risk Comparison • Continuity',
  },
  {
    title: 'Supply-Chain Network',
    summary: 'Understand how your suppliers are connected.',
    detail:
      'SuplAI maps supplier relationships and dependencies into a visual supply-chain network, helping you identify critical nodes, hidden dependencies, and potential single points of failure.',
    points: 'Multi-Tier Mapping • Dependency Analysis • Critical Nodes',
  },
  {
    title: 'Disruption Monitoring',
    summary: 'Stay ahead of supply-chain disruptions.',
    detail:
      'SuplAI monitors relevant risk signals and highlights potential threats such as logistics issues, extreme weather, market movements, and other external events that may affect supplier operations.',
    points: 'Disruption Detection • External Signals • Risk Alerts',
  },
];


const hasGoogleCallback = () => {
  const params = new URLSearchParams(window.location.search);
  const hasOAuthCode = params.has('code');

  const hashParams = new URLSearchParams(
    window.location.hash.replace(/^#/, ''),
  );

  return hasOAuthCode || hashParams.has('access_token');
};

const Home = () => {
  const loginRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  const {
    login,
    loginWithGoogle,
    register,
    isAuthenticated,
  } = useAuth();

  const { translate: t } = useLanguage();

  // Keep a stable reference so AuthContext rerenders do not
  // restart the OAuth callback effect while login is completing.
  const loginWithGoogleRef = useRef(loginWithGoogle);

  useEffect(() => {
    loginWithGoogleRef.current = loginWithGoogle;
  }, [loginWithGoogle]);

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [howToUseOpen, setHowToUseOpen] = useState(false);
  const [authTransition, setAuthTransition] = useState(hasGoogleCallback);

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setPasswordError('');
    setEmail('');
    setPassword('');
    setFullName('');
  };

  useEffect(() => {
    if (location.hash !== '#login' && location.hash !== '#signup') {
      return;
    }

    if (location.hash === '#signup') {
      setMode('register');
      setError('');
      setPasswordError('');
    } else {
      setMode('login');
      setError('');
      setPasswordError('');
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        loginRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });

        loginRef.current
          ?.querySelector('input[type="email"]')
          ?.focus({ preventScroll: true });
      });
    });
  }, [location.hash]);

  /*
   * Handle Google OAuth callback.
   *
   * Google -> Supabase -> Home
   * Then we exchange the Supabase access token
   * with our FastAPI backend to receive the normal
   * SuplAI JWT session.
   */
  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const params = new URLSearchParams(
          window.location.search,
        );

        const hasOAuthCode = params.has('code');

        const hashParams = new URLSearchParams(
          window.location.hash.replace(/^#/, ''),
        );

        const hasOAuthToken =
          hashParams.has('access_token');

        // Normal Home page visits should not redirect to Dashboard.
        if (!hasOAuthCode && !hasOAuthToken) {
          return;
        }

        console.log(
          '[Google OAuth] Callback detected',
        );

        /*
         * Clear the OAuth URL immediately.
         *
         * This is important in React StrictMode because the effect
         * can be invoked twice during development. Once the URL is
         * clean, the second invocation exits above.
         */
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );

        setAuthTransition(true);
        setGoogleLoading(true);
        setError('');

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        console.log(
          '[Google OAuth] Supabase session:',
          session,
        );

        if (!session?.access_token) {
          throw new Error(
            'Google login completed, but no Supabase access token was found.',
          );
        }

        console.log(
          '[Google OAuth] Sending token to backend...',
        );

        // Exchange the Supabase token with our backend exactly once.
        await loginWithGoogleRef.current(
          session.access_token,
        );

        console.log(
          '[Google OAuth] Backend login successful',
        );

        /*
         * Do NOT depend on the effect's mounted flag here.
         * React StrictMode can clean up the first effect instance
         * while the async Google exchange is still completing.
         */
        navigate('/dashboard', {
          replace: true,
          state: { authTransition: true },
        });
      } catch (googleError) {
        console.error(
          '[Google OAuth] ERROR:',
          googleError,
        );

        setGoogleLoading(false);
        setAuthTransition(false);

        setError(
          googleError?.response?.data?.detail ||
            googleError?.message ||
            'Unable to complete Google login. Please try again.',
        );
      }
    };

    handleGoogleCallback();
  }, [navigate]);


  const handleLogin = async (event) => {
    event.preventDefault();

    setError('');
    setAuthTransition(true);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard', {
        replace: true,
        state: { authTransition: true },
      });
    } catch (loginError) {
      setAuthTransition(false);
      setError(
        loginError.response?.data?.detail ||
          'Unable to log in. Please check your details and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setAuthTransition(true);
    setGoogleLoading(true);

    try {
      console.log(
        '[Google OAuth] Starting Google login...'
      );

      const { error: googleError } =
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });

      if (googleError) {
        throw googleError;
      }

      console.log(
        '[Google OAuth] Redirecting to Google...'
      );

      /*
       * Browser will now redirect to Google.
       * After authentication, Google/Supabase will redirect
       * back to window.location.origin.
       */
    } catch (googleError) {
      console.error(
        '[Google OAuth] START ERROR:',
        googleError
      );

      setError(
        googleError?.message ||
          'Unable to continue with Google. Please try again.',
      );

      setAuthTransition(false);
      setGoogleLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    if (password.length < 8) {
      setPasswordError('Enter 8 or more characters.');
      setAuthTransition(false);
      return;
    }

    setPasswordError('');
    setError('');
    setAuthTransition(true);
    setLoading(true);

    try {
      await register(email, password, fullName, null);
      navigate('/dashboard', {
        replace: true,
        state: { authTransition: true },
      });
    } catch (regError) {
      setAuthTransition(false);

      const detail = regError.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail
            .map((item) => item?.msg || 'Invalid input')
            .join(', ')
        : detail || 'Registration failed. Please try again.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="home-page">
      {authTransition && (
        <div
          className="auth-transition-overlay"
          role="status"
          aria-live="polite"
          aria-label="Signing you in"
        >
          <div className="spinner" aria-hidden="true" />
        </div>
      )}

      <div className="home-background" aria-hidden="true">
        <div className="home-background-track">
          {[...backgroundSlides, ...backgroundSlides].map(
            (image, index) => (
              <img
                className="home-background-slide"
                src={image}
                alt=""
                key={`${image}-${index}`}
              />
            ),
          )}
        </div>
      </div>

      <section
        className="home-hero"
        aria-labelledby="home-title"
      >
        <div className="home-hero-copy">
          <h1 id="home-title">
            <span className="home-title-main home-title-bold">
              Know what is coming,
            </span>
            <br />
            <span className="home-title-highlight">
              Keep supply moving
              <span
                className="home-typing-cursor"
                aria-hidden="true"
              >
                |
              </span>
            </span>
          </h1>
        </div>
      </section>

      <section
        className="home-feature-section"
        aria-label="SuplAI capabilities"
      >
        <div className="home-feature-cards">
          <div className="home-feature-track">
            {[0, 1].map((set) => (
              <div
                className="home-feature-card-group"
                key={set}
                aria-hidden={set === 1}
              >
                {featureCards.map((card) => (
                  <article
                    className="home-feature-card"
                    key={`${set}-${card.title}`}
                  >
                    <h2>{t(card.title)}</h2>

                    <span>{t(card.points)}</span>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {(!isAuthenticated || authTransition) && (
        <section
          id="login"
          ref={loginRef}
          className="home-login-section"
          aria-labelledby="home-card-title"
        >
        {mode === 'login' ? (
          <form
            className="home-login-form"
            onSubmit={handleLogin}
          >
            <h2 id="home-card-title">
              Welcome back
            </h2>

            <div className="home-login-field">
              <label htmlFor="hl-email">
                Email
              </label>

              <div className="home-login-input-wrap">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M4 5h16v14H4z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="m4 7 8 6 8-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>

                <input
                  id="hl-email"
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="home-login-field">
              <label htmlFor="hl-password">
                Password
              </label>

              <div className="home-login-input-wrap">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                >
                  <rect
                    x="5"
                    y="10"
                    width="14"
                    height="10"
                    rx="2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />

                  <path
                    d="M8 10V7a4 4 0 0 1 8 0v3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>

                <input
                  id="hl-password"
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  minLength={6}
                  required
                />
              </div>
            </div>

            {error && (
              <p className="home-login-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="home-login-submit"
              disabled={loading || googleLoading}
            >
              {loading
                ? 'Please wait…'
                : 'Login'}
            </button>

            {/* Google Login */}
            <button
              type="button"
              className="google-login-button"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
            >
              <svg
                className="google-login-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M21.35 12.27c0-.73-.07-1.43-.21-2.1H12v3.98h5.23a4.47 4.47 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.92-4.18 2.92-7.24Z"
                />
                <path
                  fill="#34A853"
                  d="M12 21.75c2.63 0 4.83-.87 6.43-2.35l-3.14-2.43c-.87.58-1.98.92-3.29.92-2.53 0-4.68-1.71-5.45-4.01H3.31v2.51A9.72 9.72 0 0 0 12 21.75Z"
                />
                <path
                  fill="#FBBC04"
                  d="M6.55 13.88A5.86 5.86 0 0 1 6.24 12c0-.65.11-1.28.31-1.88V7.61H3.31A9.75 9.75 0 0 0 2.25 12c0 1.58.38 3.08 1.06 4.39l3.24-2.51Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 6.11c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.18 14.63 2.25 12 2.25a9.72 9.72 0 0 0-8.69 5.36l3.24 2.51C7.32 7.82 9.47 6.11 12 6.11Z"
                />
              </svg>

              <span className="google-login-label">
                {googleLoading
                  ? 'Connecting…'
                  : 'Continue with Google'}
              </span>
            </button>

            <p className="home-login-register">
              New to SuplAI?{' '}

              <span
                className="home-login-link"
                onClick={() =>
                  switchMode('register')
                }
              >
                Create an account
              </span>
            </p>
          </form>
        ) : (
          <form
            className="home-login-form"
            onSubmit={handleRegister}
          >
            <h2>Create account</h2>

            <div className="home-login-field">
              <label htmlFor="hr-name">
                Full name
              </label>

              <div className="home-login-input-wrap">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                >
                  <circle
                    cx="12"
                    cy="8"
                    r="4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />

                  <path
                    d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>

                <input
                  id="hr-name"
                  type="text"
                  value={fullName}
                  onChange={(e) =>
                    setFullName(e.target.value)
                  }
                  placeholder="Your full name"
                  required
                />
              </div>
            </div>

            <div className="home-login-field">
              <label htmlFor="hr-email">
                Email
              </label>

              <div className="home-login-input-wrap">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M4 5h16v14H4z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />

                  <path
                    d="m4 7 8 6 8-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>

                <input
                  id="hr-email"
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="home-login-field">
              <label htmlFor="hr-password">
                Password
              </label>

              <div className="home-login-input-wrap">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                >
                  <rect
                    x="5"
                    y="10"
                    width="14"
                    height="10"
                    rx="2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />

                  <path
                    d="M8 10V7a4 4 0 0 1 8 0v3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>

                <input
                  id="hr-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    const nextPassword = e.target.value;
                    setPassword(nextPassword);
                    setPasswordError(
                      nextPassword.length > 0 && nextPassword.length < 8
                        ? 'Enter 8 or more characters.'
                        : '',
                    );
                  }}
                  placeholder="Min 8 characters"
                  minLength={8}
                  required
                  aria-describedby="hr-password-error"
                  aria-invalid={Boolean(passwordError)}
                />
              </div>

              {passwordError && (
                <p
                  id="hr-password-error"
                  className="home-password-error"
                  style={{
                    margin: '6px 0 0',
                    color: '#e53935',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    lineHeight: 1.35,
                  }}
                >
                  {passwordError}
                </p>
              )}
            </div>

            {error && (
              <p className="home-login-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="home-login-submit"
              disabled={loading || googleLoading}
            >
              {loading
                ? 'Creating account…'
                : 'Create account'}
            </button>

            <p className="home-login-register">
              Already have an account?{' '}

              <span
                className="home-login-link"
                onClick={() =>
                  switchMode('login')
                }
              >
                Sign in
              </span>
            </p>
          </form>
        )}

        <div className="home-login-cta">
          <h2 className="home-login-cta-heading">
            Login/Signup
            <br />
            <span className="home-login-cta-now">
              now
            </span>
          </h2>
        </div>
      </section>
      )}

      <section
        className={`home-bottom-card-section ${
          howToUseOpen ? 'is-expanded' : ''
        }`}
        aria-label="How to use SuplAI"
      >
        <button
          type="button"
          className="home-bottom-card"
          aria-expanded={howToUseOpen}
          aria-controls="home-how-to-content"
          onClick={() =>
            setHowToUseOpen((open) => !open)
          }
        >
          <span className="home-bottom-card-content">
            <span className="home-bottom-card-heading">
              How to use?
            </span>
          </span>
        </button>

        <div
          id="home-how-to-content"
          className={`home-how-to-content ${
            howToUseOpen ? 'is-open' : ''
          }`}
          aria-hidden={!howToUseOpen}
        >
          <div className="home-how-to-inner">
            <div className="home-how-to-steps">

              <article className="home-how-to-step">
                <div>
                  <h4>{t('Dashboard')}</h4>
                  <p>{t('Select your company and begin from the Dashboard. Use the overview to understand the current supplier landscape, overall risk, active disruptions and the areas that need attention first. Treat this as your starting point before drilling into an individual supplier or scenario.')}</p>
                </div>
              </article>

              <article className="home-how-to-step">
                <div>
                  <h4>{t('Suppliers')}</h4>
                  <p>{t('Open Suppliers to review individual suppliers and their risk scores. Check the risk level and the factors contributing to it, then focus on suppliers with higher exposure or operational importance. You can also import or manage supplier records where supported.')}</p>
                </div>
              </article>

              <article className="home-how-to-step">
                <div>
                  <h4>{t('Network')}</h4>
                  <p>{t('Open Network to see how suppliers and dependencies connect. Trace relationships across tiers, look for critical nodes and identify where one supplier can influence other parts of the network. This gives context to a supplier risk score.')}</p>
                </div>
              </article>

              <article className="home-how-to-step">
                <div>
                  <h4>{t('What-If Simulation')}</h4>
                  <p>{t('Choose a supplier and run a disruption scenario. SuplAI models how the disruption can propagate through connected dependencies and shows the affected part of the network and the resulting change in network risk. Use different scenarios to understand where a failure could create cascading impact.')}</p>
                </div>
              </article>

              <article className="home-how-to-step">
                <div>
                  <h4>{t('Alternatives')}</h4>
                  <p>{t('When a supplier looks vulnerable, open Alternatives to review potential replacement options. Compare available supplier information and risk characteristics so you can evaluate which options may help maintain supply continuity.')}</p>
                </div>
              </article>

              <article className="home-how-to-step">
                <div>
                  <h4>{t('Disruptions')}</h4>
                  <p>{t('Use Disruptions to review events that may affect suppliers or logistics, including relevant weather, market, news or operational signals available to the platform. Open an event to understand its relevance and connect the signal back to affected suppliers.')}</p>
                </div>
              </article>

              <article className="home-how-to-step">
                <div>
                  <h4>{t('Alerts')}</h4>
                  <p>{t('Check Alerts for important risk changes and signals. Use alerts as a prioritization layer: investigate the supplier or disruption behind an alert, then move into Network, Simulation or Alternatives when deeper analysis is required.')}</p>
                </div>
              </article>

              <article className="home-how-to-step">
                <div>
                  <h4>{t('Settings & Data')}</h4>
                  <p>{t('Use Settings for available account and workspace controls. Keep supplier information organized and up to date so the risk, network and simulation views remain useful. Export available reports or data when you need to share analysis.')}</p>
                </div>
              </article>

            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;