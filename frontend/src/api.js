import axios from 'axios';

const baseURL = (
  import.meta.env.VITE_API_URL || '/api'
).replace(/\/$/, '');

/* =========================================================
   TOKEN KEYS
   ========================================================= */

export const TOKEN_KEY = 'suplai_token';
export const REFRESH_KEY = 'suplai_refresh';

/* =========================================================
   AXIOS INSTANCE
   ========================================================= */

const api = axios.create({
  baseURL,
  timeout: 30000,
});

/* =========================================================
   REQUEST INTERCEPTOR
   Automatically attach access token
   ========================================================= */

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/* =========================================================
   AUTH CLEARED HANDLER
   ========================================================= */

let onAuthCleared = null;

export function setAuthClearedHandler(fn) {
  onAuthCleared = fn;
}

/* =========================================================
   CLEAR TOKENS
   ========================================================= */

function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);

  if (onAuthCleared) {
    onAuthCleared();
  }
}

/* =========================================================
   REFRESH DEDUPLICATION
   ========================================================= */

let refreshPromise = null;

/* =========================================================
   REFRESH ACCESS TOKEN
   ========================================================= */

async function performRefresh() {
  const refresh_token =
    localStorage.getItem(REFRESH_KEY);

  if (!refresh_token) {
    throw new Error('NO_REFRESH_TOKEN');
  }

  const { data } = await axios.post(
    `${baseURL}/auth/refresh`,
    {
      refresh_token,
    },
    {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (!data?.access_token) {
    throw new Error(
      'Refresh response did not contain an access token',
    );
  }

  localStorage.setItem(
    TOKEN_KEY,
    data.access_token,
  );

  if (data.refresh_token) {
    localStorage.setItem(
      REFRESH_KEY,
      data.refresh_token,
    );
  }

  return data;
}

/* =========================================================
   RESPONSE INTERCEPTOR
   ========================================================= */

api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (!original) {
      return Promise.reject(error);
    }

    const url = original.url || '';

    const isAuthRequest =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/google') ||
      url.includes('/auth/refresh');

    if (
      status !== 401 ||
      original._retry ||
      isAuthRequest
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    const refreshToken =
      localStorage.getItem(REFRESH_KEY);

    if (!refreshToken) {
      return Promise.reject(error);
    }

    try {
      if (!refreshPromise) {
        refreshPromise = performRefresh();
      }

      await refreshPromise;

      refreshPromise = null;

      const token =
        localStorage.getItem(TOKEN_KEY);

      if (!token) {
        throw new Error(
          'Unable to obtain a new access token',
        );
      }

      original.headers = {
        ...original.headers,
        Authorization: `Bearer ${token}`,
      };

      return api(original);

    } catch (refreshErr) {
      refreshPromise = null;

      clearTokens();

      return Promise.reject(refreshErr);
    }
  },
);

/* =========================================================
   BACKEND HEALTH CHECK
   ========================================================= */

export async function checkBackendHealth() {
  try {
    const { data } = await api.get(
      '/health',
      {
        timeout: 5000,
      },
    );

    return data?.status === 'ok';

  } catch {
    try {
      await api.get(
        '/',
        {
          timeout: 5000,
        },
      );

      return true;

    } catch {
      return false;
    }
  }
}

/* =========================================================
   EXPORT API
   ========================================================= */

export default api;