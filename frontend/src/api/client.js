import api, { checkBackendHealth } from '../api.js';

export { checkBackendHealth };
import companiesFallback from '../data/companies.js';

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function register(email, password, full_name, company_id) {
  const { data } = await api.post('/auth/register', { email, password, full_name, company_id });
  return data;
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function fetchCompanies() {
  try {
    const { data } = await api.get('/companies');
    if (Array.isArray(data) && data.length) return data;
  } catch {
    /* fallback */
  }
  return companiesFallback;
}

export async function fetchDashboard(companyId) {
  const { data } = await api.get(`/dashboard/${companyId}`);
  return data;
}

export async function fetchSupplierRisk(companyId) {
  const { data } = await api.get(`/suppliers/${companyId}/risk`);
  return data;
}

export async function fetchAlternatives(companyId) {
  const { data } = await api.get(`/suppliers/${companyId}/alternatives`);
  return data;
}

export async function fetchActiveDisruptions() {
  const { data } = await api.get('/disruptions/active');
  return data;
}

export async function fetchGraph(companyId) {
  const { data } = await api.get(`/graph/${companyId}`);
  return data;
}

export async function fetchRiskTrend(companyId, days = 30) {
  try {
    const { data } = await api.get(`/risk/trend/${companyId}`, { params: { days } });
    if (data?.length) {
      return data.map((p) => ({
        date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: p.score,
      }));
    }
  } catch {
    /* fallback in UI */
  }
  return null;
}

export async function fetchAlerts(companyId) {
  const { data } = await api.get(`/alerts/${companyId}`);
  return data;
}

export async function markAlertRead(alertId) {
  const { data } = await api.patch(`/alerts/${alertId}/read`);
  return data;
}

export async function runNlpPipeline() {
  const { data } = await api.post('/nlp/run');
  return data;
}

export async function recalculateRisk(companyId) {
  const { data } = await api.post(`/risk/recalculate/${companyId}`);
  return data;
}

// ── New backend features ──────────────────────────────────────────────

export async function refreshTokens(refreshToken) {
  const { data } = await api.post('/auth/refresh', { refresh_token: refreshToken });
  return data;
}

export async function simulateGraph(companyId, disruptedNodeIds, decay = 0.55) {
  const { data } = await api.post('/graph/simulate', {
    company_id: companyId,
    disrupted_node_ids: disruptedNodeIds,
    decay,
  });
  return data;
}

export async function geocodeAddress(query) {
  const { data } = await api.get('/external/geocode', { params: { q: query } });
  return data;
}

export async function fetchWeather({ lat, lon, location } = {}) {
  const { data } = await api.get('/external/weather', {
    params: { lat, lon, location },
  });
  return data;
}

export async function fetchNews(query) {
  // Requires auth header (added automatically by the request interceptor).
  const { data } = await api.get('/external/news', { params: { q: query } });
  return data;
}

export async function fetchFx(quote = 'INR', base = 'USD') {
  const { data } = await api.get('/external/fx', { params: { quote, base } });
  return data;
}
