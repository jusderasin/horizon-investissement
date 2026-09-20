-- Horizon Investment: PostgreSQL foundation for sourced fundamental screening.
-- Apply with psql "$DATABASE_URL" -f database/schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE asset_status AS ENUM ('active', 'inactive', 'delisted');
CREATE TYPE source_kind AS ENUM ('market_data', 'filing', 'investor_relations', 'computed');
CREATE TYPE screening_status AS ENUM ('running', 'completed', 'failed');

CREATE TABLE securities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL,
  exchange TEXT NOT NULL DEFAULT 'UNKNOWN',
  name TEXT,
  sector TEXT,
  industry TEXT,
  currency CHAR(3),
  cik TEXT,
  status asset_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ticker, exchange)
);

CREATE TABLE data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  kind source_kind NOT NULL,
  base_url TEXT NOT NULL,
  terms_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE financial_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  security_id UUID NOT NULL REFERENCES securities(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES data_sources(id),
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('annual', 'quarterly', 'ttm')),
  reported_at TIMESTAMPTZ,
  revenue NUMERIC(22, 2),
  net_income NUMERIC(22, 2),
  ebitda NUMERIC(22, 2),
  operating_income NUMERIC(22, 2),
  operating_cash_flow NUMERIC(22, 2),
  capex NUMERIC(22, 2),
  free_cash_flow NUMERIC(22, 2),
  total_assets NUMERIC(22, 2),
  total_liabilities NUMERIC(22, 2),
  total_equity NUMERIC(22, 2),
  cash_and_equivalents NUMERIC(22, 2),
  total_debt NUMERIC(22, 2),
  raw_payload JSONB,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (security_id, source_id, period_end, period_type)
);

CREATE TABLE metric_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  security_id UUID NOT NULL REFERENCES securities(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES data_sources(id),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  market_cap NUMERIC(22, 2),
  price NUMERIC(18, 6),
  pe_ratio NUMERIC(14, 4),
  price_to_fcf NUMERIC(14, 4),
  ev_to_ebitda NUMERIC(14, 4),
  roe NUMERIC(12, 6),
  roce NUMERIC(12, 6),
  net_margin NUMERIC(12, 6),
  revenue_cagr_3y NUMERIC(12, 6),
  revenue_cagr_5y NUMERIC(12, 6),
  net_debt_to_ebitda NUMERIC(14, 4),
  fcf_yield NUMERIC(12, 6),
  altman_z_score NUMERIC(14, 4),
  raw_payload JSONB
);

CREATE TABLE screening_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status screening_status NOT NULL DEFAULT 'running',
  algorithm_version TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT
);

CREATE TABLE screening_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES screening_runs(id) ON DELETE CASCADE,
  security_id UUID NOT NULL REFERENCES securities(id) ON DELETE CASCADE,
  metric_snapshot_id UUID REFERENCES metric_snapshots(id) ON DELETE SET NULL,
  passed_filter BOOLEAN NOT NULL,
  global_score NUMERIC(5, 2) NOT NULL CHECK (global_score BETWEEN 0 AND 100),
  medium_term_score NUMERIC(5, 2) NOT NULL CHECK (medium_term_score BETWEEN 0 AND 100),
  long_term_score NUMERIC(5, 2) NOT NULL CHECK (long_term_score BETWEEN 0 AND 100),
  medium_term_allocation NUMERIC(5, 2) NOT NULL CHECK (medium_term_allocation BETWEEN 0 AND 100),
  long_term_allocation NUMERIC(5, 2) NOT NULL CHECK (long_term_allocation BETWEEN 0 AND 100),
  confidence_score NUMERIC(5, 2) NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, security_id),
  CHECK (medium_term_allocation + long_term_allocation = 100)
);

CREATE INDEX financial_snapshots_security_period_idx ON financial_snapshots (security_id, period_end DESC);
CREATE INDEX metric_snapshots_security_calculated_idx ON metric_snapshots (security_id, calculated_at DESC);
CREATE INDEX screening_results_run_passed_idx ON screening_results (run_id, passed_filter, global_score DESC);

INSERT INTO data_sources (name, kind, base_url, terms_url)
VALUES ('Yahoo Finance', 'market_data', 'https://finance.yahoo.com/', 'https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html')
ON CONFLICT (name) DO NOTHING;
