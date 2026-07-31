export function riskLevel(score) {
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

export function riskColor(score) {
  const level = riskLevel(score);
  if (level === 'high') return '#ef4444';
  if (level === 'medium') return '#f59e0b';
  return '#22c55e';
}

export function severityFromEvent(event) {
  const raw = (event?.severity || '').toLowerCase();
  if (raw.includes('critical') || raw.includes('high')) return 'high';
  if (raw.includes('medium') || raw.includes('med')) return 'medium';
  if (raw.includes('low')) return 'low';
  return 'medium';
}

export function compositeFromSupplier(supplier) {
  const risk = supplier.risk_score ?? 50;
  const cost = supplier.cost_index ?? 50;
  const lead = supplier.lead_time_days ?? 30;
  const rating = supplier.rating ?? 3;
  return Math.round((100 - risk) * 0.4 + rating * 10 * 0.3 + (100 - cost) * 0.2 + (60 - lead) * 0.1);
}

export function alternativeRowTone(composite) {
  if (composite >= 70) return 'best';
  if (composite >= 50) return 'ok';
  return 'avoid';
}
