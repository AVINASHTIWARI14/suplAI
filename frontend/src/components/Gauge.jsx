import { riskColor, riskLevel } from '../utils/risk.js';

const Gauge = ({ value = 0, trend }) => {
  const normalized = Math.min(100, Math.max(0, Math.round(value)));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;
  const level = riskLevel(normalized);
  const color = riskColor(normalized);

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="card-title" style={{ marginBottom: 12 }}>Overall Risk Score</div>
      <div className="gauge-donut">
        <svg width="140" height="140" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="gauge-center">
          <div className="value">{normalized}</div>
          <div className="label" style={{ color }}>{level === 'high' ? 'High Risk' : level === 'medium' ? 'Medium Risk' : 'Low Risk'}</div>
        </div>
      </div>
      {trend != null && (
        <div className="gauge-trend">
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last 7 days
        </div>
      )}
    </div>
  );
};

export default Gauge;
