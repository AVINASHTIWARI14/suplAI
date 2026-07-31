-- SuplAI Supabase / PostgreSQL schema
-- Run the whole file in the Supabase SQL editor to provision a fresh project.
-- Order matters: base tables first, then dependent tables.

-- ---- Base entities ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  risk_score NUMERIC(5,2) DEFAULT 40,
  location TEXT,
  country TEXT,
  cost_index NUMERIC(5,2),
  rating NUMERIC(3,2),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company -> supplier links (tier 1)
CREATE TABLE IF NOT EXISTS dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT TRUE,
  is_alternate BOOLEAN DEFAULT FALSE,
  lead_time_days INT,
  cost_per_unit NUMERIC(10,2),
  UNIQUE(company_id, supplier_id)
);

CREATE TABLE IF NOT EXISTS disruption_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT,
  country TEXT,
  event_type TEXT,
  severity TEXT,
  affected_industry TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Auth ------------------------------------------------------------------
-- Roles: 'admin' (full CRUD) or 'viewer' (read-only). Default is read-only.
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'viewer',
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Multi-tier graph ------------------------------------------------------
CREATE TABLE IF NOT EXISTS supplier_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  child_supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  tier INT DEFAULT 2,
  UNIQUE(parent_supplier_id, child_supplier_id)
);

-- ---- Risk history for trend charts -----------------------------------------
CREATE TABLE IF NOT EXISTS risk_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  risk_score NUMERIC(5,2) NOT NULL,
  recorded_at DATE DEFAULT CURRENT_DATE,
  UNIQUE(company_id, recorded_at)
);

-- ---- Alerts ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT,
  severity TEXT DEFAULT 'high',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Key/value config (risk thresholds, etc.) ------------------------------
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Indexes ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_dependencies_company ON dependencies(company_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_supplier ON dependencies(supplier_id);
CREATE INDEX IF NOT EXISTS idx_alerts_company ON alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_risk_history_company ON risk_history(company_id);
CREATE INDEX IF NOT EXISTS idx_disruptions_start ON disruption_events(start_date DESC);
