import { riskLevel } from '../utils/risk.js';

const RiskBadge = ({ score = 0, severity }) => {
  const level = severity || riskLevel(score);
  const label = level === 'high' ? 'High' : level === 'medium' ? 'Medium' : 'Low';

  return (
    <span className={`risk-badge ${level}`}>
      {label}
    </span>
  );
};

export default RiskBadge;
