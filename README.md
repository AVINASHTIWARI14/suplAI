# SuplAI — AI-Powered Supply Chain Risk Monitoring

Warns companies **before** supply chain disruptions hit. Multi-tier supplier
dependency mapping, live risk scoring, a **What-If disruption simulation
engine**, an interactive network graph, and real external data signals
(weather, news, currency).

| Capability | Description |
|------------|-------------|
| **Monitor** | Disruption news feed (NewsData.io) + NLP detection |
| **Map & Graph** | Multi-tier company → supplier dependency graph + Leaflet map |
| **Score** | Exponential-decay risk scoring; live severe-weather signal folds in |
| **Simulate** | Mark any node "disrupted" → cascade propagation across the network |
| **Alert** | In-app notifications when a node crosses a risk threshold |
| **Export** | CSV / PDF risk report of the current network state |

---

## Architecture

- **Backend:** FastAPI (Python), modular `routers/` + `services/`, NetworkX for
  the graph/cascade engine, JWT auth, rate limiting (slowapi).
  > Note: the graph service lives in `services/graph_service.py` (the original
  > brief referred to it as `supply_graph.py`; the file was already named
  > `graph_service.py` and was kept to avoid breaking imports).
- **Frontend:** React + Vite, Leaflet map, `react-force-graph-2d` network view,
  Recharts, Axios.
- **Database:** Supabase (Postgres). The app runs fully in **demo mode** with
  built-in synthetic data when Supabase is not configured or unreachable, so it
  works out-of-the-box.

---

## Quick start

### 1. Environment

```bash
cp .env.example .env
```

Then fill in `.env`. At minimum, set a strong `JWT_SECRET_KEY`:

```bash
python -c "import secrets;print(secrets.token_urlsafe(48))"
```

The app runs without any API keys (external signals fall back to clearly-flagged
demo data). Add keys to enable live data — see **API keys** below.

### 2. Backend

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm    # optional, only for the NLP pipeline
python scripts/init_users.py               # seeds local demo login accounts
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

API docs: http://127.0.0.1:8000/docs

### 3. Database (optional — Supabase)

Run `database/schema.sql` in the Supabase SQL editor (it provisions **all**
tables from scratch: companies, suppliers, dependencies, disruption_events,
app_users, alerts, risk_history, supplier_dependencies, app_config). Then set
`SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `.env`.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### 5. Login

| Email | Password | Role |
|-------|----------|------|
| admin@suplai.com | admin123 | **admin** (full CRUD) |
| viewer@suplai.com | viewer123 | **viewer** (read-only) |

New signups default to the read-only **viewer** role.

---

## API keys required (all FREE, none require a credit card)

Paste these into `.env`. Leave any blank to run that signal in demo/fallback
mode (responses are flagged with `"source": "fallback"`).

| Env variable | Service | Free tier | Sign-up |
|--------------|---------|-----------|---------|
| `OPENWEATHER_API_KEY` | OpenWeatherMap | 1,000 calls/day | https://openweathermap.org/api → Account → API keys |
| `NOMINATIM_USER_AGENT` | OpenStreetMap Nominatim | free, **no key** (needs a descriptive User-Agent w/ contact) | https://nominatim.org/ (usage policy) |
| `NEWSDATA_API_KEY` | NewsData.io | 200 credits/day | https://newsdata.io → Dashboard → API Key |
| `EXCHANGERATE_API_KEY` | ExchangeRate-API | free tier | https://www.exchangerate-api.com/ → Dashboard |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | Supabase | free tier | https://app.supabase.com → Project Settings → API |
| `JWT_SECRET_KEY` | (self-generated) | — | `python -c "import secrets;print(secrets.token_urlsafe(48))"` |

---

## Security notes

- **CORS** is restricted to `CORS_ALLOWED_ORIGINS` (no `*` with credentials).
- **JWT** uses `JWT_SECRET_KEY`; the app **refuses to boot** in
  `APP_ENV=production` if the secret is missing/default. Access + refresh tokens
  are distinct types (a refresh token cannot be used as an access token).
- **Roles:** `admin` (full CRUD) vs `viewer` (read-only). Write endpoints are
  guarded by `require_admin`.
- **Rate limiting** via slowapi on auth endpoints.
- **Input validation** via Pydantic models on every endpoint.
- `.env` is gitignored; `.env.example` documents every variable.

> ⚠️ If the previously-committed `.env` service_role key ever left your machine,
> **rotate it** in Supabase (Settings → API → reset). Gitignoring does not
> un-leak an exposed key.

---

## Main API endpoints

| Method | Path | Auth |
|--------|------|------|
| POST | `/auth/register` `/auth/login` `/auth/refresh` | No (rate-limited) |
| GET | `/auth/me` | Yes |
| GET | `/companies` | No |
| GET | `/dashboard/{company_id}` | No |
| GET | `/dashboard/{company_id}/export.csv` `/export.pdf` | Yes |
| GET | `/suppliers/{company_id}/risk` `/alternatives` | No |
| POST/PUT/DELETE | `/suppliers` `/suppliers/{id}` | **Admin** |
| POST | `/suppliers/import/{company_id}` (CSV bulk) | **Admin** |
| GET | `/graph/{company_id}` | No |
| POST | `/graph/simulate` (What-If engine) | No |
| GET | `/alerts/{company_id}` | Yes |
| GET/POST | `/risk/trend/{id}`, `/risk/recalculate/{id}` (admin) | Yes |
| GET/PUT | `/risk/thresholds` (PUT admin) | Yes |
| GET | `/external/geocode` `/weather` `/fx` | No |
| GET | `/external/news` | Yes |

---

## What-If simulation

`POST /graph/simulate` with `{company_id, disrupted_node_ids: [...], decay}`
builds the network in NetworkX, propagates a risk shock **upstream** (a
supplier's failure hurts everything that depends on it), decaying per hop, and
returns the affected nodes, cascade edges, count of critical paths broken, and
the network risk before/after.
