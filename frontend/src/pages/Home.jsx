import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import cargoShipHome from '../assets/cargo-ship-home.png';
import freightTruckHome from '../assets/freight-truck-home.png';
import cargoPlaneHome from '../assets/cargo-plane-home.png';
import { useAuth } from '../context/AuthContext.jsx';

const backgroundSlides = [cargoShipHome, freightTruckHome, cargoPlaneHome];
const featureCards = [
  {
    title: 'Supplier Risk Intelligence',
    summary: 'Identify suppliers that could put your operations at risk.',
    detail: 'SuplAI evaluates supplier-level risk and assigns a clear risk score so teams can prioritize vulnerabilities.',
    points: 'Risk Score • Risk Factors • Prioritization',
  },
  {
    title: 'What-If Simulation',
    summary: 'See the impact before a disruption happens.',
    detail: 'Simulate supplier failures and visualize how disruption propagates across your supply network.',
    points: 'Failure Simulation • Network Impact • Risk Delta',
  },
  {
    title: 'Alternative Suppliers',
    summary: 'Find alternatives when your supply chain is at risk.',
    detail: 'Compare potential suppliers and identify options that can help maintain supply continuity.',
    points: 'Alternatives • Risk Comparison • Continuity',
  },
  {
    title: 'Supply-Chain Network',
    summary: 'Understand how your suppliers are connected.',
    detail: 'SuplAI maps supplier relationships and dependencies into a visual supply-chain network, helping you identify critical nodes, hidden dependencies, and potential single points of failure.',
    points: 'Multi-Tier Mapping • Dependency Analysis • Critical Nodes',
  },
  {
    title: 'Disruption Monitoring',
    summary: 'Stay ahead of supply-chain disruptions.',
    detail: 'SuplAI monitors relevant risk signals and highlights potential threats such as logistics issues, extreme weather, market movements, and other external events that may affect supplier operations.',
    points: 'Disruption Detection • External Signals • Risk Alerts',
  },
];

const Home = () => {
  const loginRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.hash !== '#login') return;
    requestAnimationFrame(() => {
      loginRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      loginRef.current?.querySelector('input[type="email"]')?.focus({ preventScroll: true });
    });
  }, [location.hash]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (loginError) {
      setError(loginError.response?.data?.detail || 'Unable to log in. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
  <main className="home-page">
    <div className="home-background" aria-hidden="true">
      <div className="home-background-track">
        {[...backgroundSlides, ...backgroundSlides].map((image, index) => (
          <img className="home-background-slide" src={image} alt="" key={`${image}-${index}`} />
        ))}
      </div>
    </div>

    <section className="home-hero" aria-labelledby="home-title">
      <div className="home-hero-copy">
        <h1 id="home-title">Know what is coming,<br /><span className="home-title-highlight">Keep supply moving.</span></h1>
      </div>
    </section>

    <section className="home-feature-section" aria-label="SuplAI capabilities">
      <div className="home-feature-cards">
        <div className="home-feature-track">
          {[0, 1].map((set) => (
            <div className="home-feature-card-group" key={set} aria-hidden={set === 1}>
              {featureCards.map((card) => (
                <article className="home-feature-card" key={`${set}-${card.title}`}>
                  <h2>{card.title}</h2>
                  <p>{card.summary}</p>
                  <p>{card.detail}</p>
                  <span>{card.points}</span>
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>

    <section id="login" ref={loginRef} className="home-login-section" aria-labelledby="home-login-title">
      <form className="home-login-form" onSubmit={handleLogin}>
        <h2 id="home-login-title">Welcome back</h2>
        <div className="home-login-field">
          <label htmlFor="home-login-email">Email</label>
          <div className="home-login-input-wrap">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 5h16v14H4z" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
            <input id="home-login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" required />
          </div>
        </div>
        <div className="home-login-field">
          <label htmlFor="home-login-password">Password</label>
          <div className="home-login-input-wrap">
            <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
            <input id="home-login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" minLength={6} required />
          </div>
        </div>
        <div className="home-login-options">
          <label><input type="checkbox" /> Remember me</label>
          <button type="button">Forgot password?</button>
        </div>
        {error && <p className="home-login-error">{error}</p>}
        <button type="submit" className="home-login-submit" disabled={loading}>{loading ? 'Please wait…' : 'Login'}</button>
        <p className="home-login-register">New to SuplAI? <button type="button">Create an account</button></p>
      </form>
    </section>
  </main>
  );
};

export default Home;
/*  */
