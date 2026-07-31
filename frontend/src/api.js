import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://127.0.0.1:8000');

export const TOKEN_KEY = 'suplai_token';
export const REFRESH_KEY = 'suplai_refresh';

const api = axios.create({
  baseURL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Allow the app (AuthContext) to react to a forced logout after a failed refresh.
let onAuthCleared = null;
export function setAuthClearedHandler(fn) {
  onAuthCleared = fn;
}

function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  if (onAuthCleared) onAuthCleared();
}

// De-duplicate concurrent refreshes.
let refreshPromise = null;

async function performRefresh() {
  const refresh_token = localStorage.getItem(REFRESH_KEY);
  if (!refresh_token) throw new Error('no refresh token');
  // Bare axios call so we don't trigger the interceptor recursively.
  const { data } = await axios.post(`${baseURL}/auth/refresh`, { refresh_token }, { timeout: 15000 });
  if (data?.access_token) localStorage.setItem(TOKEN_KEY, data.access_token);
  if (data?.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
  return data;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isRefreshCall = original?.url?.includes('/auth/refresh');

    if (status === 401 && original && !original._retry && !isRefreshCall) {
      original._retry = true;
      try {
        if (!refreshPromise) refreshPromise = performRefresh();
        await refreshPromise;
        refreshPromise = null;
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
        return api(original);
      } catch (refreshErr) {
        refreshPromise = null;
        clearTokens();
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  },
);

export default api;

export async function checkBackendHealth() {
  try {
    const { data } = await api.get('/health', { timeout: 5000 });
    return data?.status === 'ok';
  } catch {
    try {
      await api.get('/', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}
