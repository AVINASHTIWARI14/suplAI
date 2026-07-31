import { riskColor, riskLevel } from '../utils/risk.js';

const RiskBadge = ({ score = 0, severity }) => {
  const level = severity || riskLevel(score);
  const color = riskColor(score);
  const label = level === 'high' ? 'High' : level === 'medium' ? 'Medium' : 'Low';

  return (
    <span
      className="risk-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: `${color}22`,
        color,
        fontWeight: 700,
        fontSize: '0.72rem',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {label}
    </span>
  );
};

export default RiskBadge;
