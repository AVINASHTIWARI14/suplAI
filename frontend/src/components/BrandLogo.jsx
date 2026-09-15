import { Link } from 'react-router-dom';

const BrandLogo = ({ variant = 'nav' }) => (
  <Link to="/" className={`brand-logo brand-logo--${variant}`} aria-label="Go to SuplAI home">
    <span className="brand-logo__supl">Supl</span>
    <span className="brand-logo__ai">AI</span>
    <span className="brand-logo__mark-wrap"><span className="brand-logo__mark" aria-hidden="true" /></span>
  </Link>
);

export default BrandLogo;
