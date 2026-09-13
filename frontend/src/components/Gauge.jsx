import { useEffect, useState } from 'react';
import { riskLevel } from '../utils/risk.js';

function blendRiskColor(score) {
  const stops = [
    [0, [34, 197, 94]],
    [30, [234, 179, 8]],
    [60, [249, 115, 22]],
    [80, [239, 68, 68]],
    [100, [255, 0, 0]],
  ];
  const bounded = Math.min(100, Math.max(0, score));
  const upperIndex = stops.findIndex(([stop]) => bounded <= stop);
  if (upperIndex <= 0) return `rgb(${stops[0][1].join(',')})`;
  const [upperStop, upperColor] = stops[upperIndex];
  const [lowerStop, lowerColor] = stops[upperIndex - 1];
  const progress = (bounded - lowerStop) / (upperStop - lowerStop);
  const color = lowerColor.map((channel, index) => Math.round(channel + (upperColor[index] - channel) * progress));
  return `rgb(${color.join(',')})`;
}

const Gauge = ({ value = 0, trend }) => {
  const [scanned, setScanned] = useState(false);
  const [displayedScore, setDisplayedScore] = useState(0);
  const normalized = Math.min(100, Math.max(0, Math.round(value)));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const level = riskLevel(displayedScore);
  const color = blendRiskColor(displayedScore);
  const offset = circumference - (displayedScore / 100) * circumference;

  useEffect(() => {
    if (!scanned) return undefined;

    const startedAt = performance.now();
    const duration = 1600;
    let frameId;
    const animate = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayedScore(Math.round(normalized * eased));
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [scanned, normalized]);

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="gauge-title">Overall Risk Score</div>
      {!scanned ? (
        <button type="button" className="gauge-scan-button" onClick={() => setScanned(true)}>
          <span>SCAN</span>
        </button>
      ) : (
        <div className="gauge-donut gauge-donut-revealed">
        <svg width="180" height="180" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(63,55,32,0.12)" strokeWidth="10" />
          <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <div className="gauge-center">
          <div className="value">{displayedScore}</div>
          <div className="label" style={{ color }}>{level === 'high' ? 'High Risk' : level === 'medium' ? 'Medium Risk' : 'Low Risk'}</div>
        </div>
        </div>
      )}
      {trend != null && (
        <div className="gauge-trend">
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last 7 days
        </div>
      )}
    </div>
  );
};

export default Gauge;
