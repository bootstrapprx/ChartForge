-- Initial schema for ChartForge (Supabase)
-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- Users (Supabase auth profiles)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  hashed_password text,
  is_active boolean not null default true,
  is_superuser boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ix_users_email on public.users (email);

-- Companies
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ucid text not null,
  is_active boolean not null default true,
  inactivated_at timestamptz,
  inactivated_by text,
  email text,
  phone text,
  website text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text,
  tax_id text,
  industry text,
  description text
);
create unique index if not exists ix_companies_ucid on public.companies (ucid);
create index if not exists ix_companies_name on public.companies (name);
create unique index if not exists ix_companies_ucid_active on public.companies (ucid) where is_active = true;
create unique index if not exists ix_companies_name_active on public.companies (name) where is_active = true;

-- User-company permissions
create table if not exists public.user_companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  is_admin boolean not null default false,
  can_edit boolean not null default true,
  can_view boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, company_id)
);
create index if not exists ix_user_companies_user_id on public.user_companies (user_id);
create index if not exists ix_user_companies_company_id on public.user_companies (company_id);

-- Master chart of accounts
create table if not exists public.master_accounts (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  description text not null,
  long_description text,
  type varchar(10) not null,
  category text not null,
  fs_mapping text,
  parent_code text,
  normal_balance varchar(10),
  tags text[] default '{}',
  default_vendors text[] default '{}',
  regulatory_mapping text,
  start_date date,
  end_date date,
  notes text,
  subcategory text,
  cash_flow_classification text,
  cost_center text,
  gaap_classification text,
  detailed_description text,
  level integer not null default 0,
  parent_id uuid references public.master_accounts(id),
  version integer not null default 1
);
create unique index if not exists ix_master_accounts_code on public.master_accounts (code);
create index if not exists ix_master_accounts_parent_code on public.master_accounts (parent_code);

-- Company accounts
create table if not exists public.company_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  code text not null,
  description text not null,
  type char(1) not null,
  parent_code text,
  name text,
  currency char(3) not null default 'USD',
  is_active boolean not null default true,
  master_account_code text references public.master_accounts(code),
  json_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ix_company_accounts_company_id on public.company_accounts (company_id);
create index if not exists ix_company_accounts_code on public.company_accounts (code);
create index if not exists ix_company_accounts_master_account_code on public.company_accounts (master_account_code);

-- Account mappings (suggestions/results)
create table if not exists public.account_mappings (
  id uuid primary key default gen_random_uuid(),
  company_account_id uuid not null references public.company_accounts(id),
  master_code text,
  confidence double precision not null,
  status text not null default 'suggested',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ix_account_mappings_master_code on public.account_mappings (master_code);
create index if not exists ix_account_mappings_status on public.account_mappings (status);

-- Legacy mappings table (kept for compatibility)
create table if not exists public.mappings (
  id bigserial primary key,
  company_account_id uuid not null references public.company_accounts(id),
  master_account_id uuid not null references public.master_accounts(id),
  score double precision not null,
  status text default 'suggested'
);

-- Templates
create table if not exists public.coa_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  version text,
  created_at timestamptz not null default now(),
  data jsonb not null
);

-- Snapshots
create table if not exists public.coa_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  data jsonb not null
);

-- Organizer memory and rules
create table if not exists public.organizer_memory (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  normalized_text text not null,
  chosen_category text not null,
  chosen_parent text,
  chosen_type text,
  chosen_nature text,
  source text not null default 'user',
  vector jsonb,
  created_at timestamptz not null default now()
);
create index if not exists ix_organizer_memory_normalized_text on public.organizer_memory (normalized_text);

create table if not exists public.organizer_rules (
  id uuid primary key default gen_random_uuid(),
  rule_pattern text not null unique,
  suggested_category text not null,
  suggested_parent text,
  confidence double precision not null default 0.9,
  created_at timestamptz not null default now()
);
create index if not exists ix_organizer_rules_rule_pattern on public.organizer_rules (rule_pattern);

-- System settings
create table if not exists public.system_settings (
  key text primary key,
  value text,
  description text
);

-- QuickBooks tokens
create table if not exists public.qbo_tokens (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  realm_id text not null,
  access_token text not null,
  refresh_token text not null,
  token_type text default 'Bearer',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists ix_qbo_tokens_company_id on public.qbo_tokens (company_id);
create index if not exists ix_qbo_tokens_realm_id on public.qbo_tokens (realm_id);

-- Audit logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null default now(),
  user_id text,
  action text not null,
  entity_type text not null,
  entity_id text,
  payload jsonb
);

-- Chart of accounts versions
create table if not exists public.coa_versions (
  id uuid primary key default gen_random_uuid(),
  version_number integer not null,
  created_at timestamptz not null default now(),
  created_by text,
  description text,
  account_count integer not null default 0,
  accounts_data jsonb not null,
  change_summary jsonb,
  source text,
  company_ucid text
);
create index if not exists ix_coa_versions_version_number on public.coa_versions (version_number);
create index if not exists ix_coa_versions_company_ucid on public.coa_versions (company_ucid);

-- Import history
create table if not exists public.import_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by text,
  filename text,
  source_type text,
  total_records integer not null default 0,
  created integer not null default 0,
  updated integer not null default 0,
  skipped integer not null default 0,
  errors integer not null default 0,
  import_log jsonb,
  version_id uuid,
  company_ucid text
);
create index if not exists ix_import_history_company_ucid on public.import_history (company_ucid);

-- Embeddings (pgvector)
create table if not exists public.embeddings (
  id uuid primary key default gen_random_uuid(),
  company_ucid text not null,
  entity_type text not null,
  content text not null,
  vector vector(1536),
  meta_data jsonb
);
create index if not exists ix_embeddings_company_ucid on public.embeddings (company_ucid);

-- User database configs (legacy per-user DBs)
create table if not exists public.user_database_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  db_host text not null,
  db_port text not null default '5432',
  db_name text not null,
  db_user text not null,
  encrypted_db_password text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);
