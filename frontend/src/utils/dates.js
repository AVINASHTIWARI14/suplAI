export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function timeAgo(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}

export function buildRiskTrend(score) {
  const base = Math.round(score ?? 0);
  const today = new Date();
  const points = [];
  for (let i = 29; i >= 0; i -= 6) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const drift = Math.sin(i / 4) * 8 + (29 - i) * 0.15;
    points.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: Math.min(100, Math.max(0, Math.round(base - drift + (i === 0 ? 0 : 4)))),
    });
  }
  if (points.length) points[points.length - 1].score = base;
  return points;
}
