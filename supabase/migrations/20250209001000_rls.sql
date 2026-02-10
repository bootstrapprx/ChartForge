-- Row Level Security policies

-- Helper functions
create or replace function public.is_superuser()
returns boolean
language sql stable
as $$
  select coalesce((select is_superuser from public.users where id = auth.uid()), false);
$$;

create or replace function public.is_company_member(company_uuid uuid)
returns boolean
language sql stable
as $$
  select exists(
    select 1
    from public.user_companies uc
    where uc.user_id = auth.uid()
      and uc.company_id = company_uuid
  ) or public.is_superuser();
$$;

create or replace function public.is_company_admin(company_uuid uuid)
returns boolean
language sql stable
as $$
  select exists(
    select 1
    from public.user_companies uc
    where uc.user_id = auth.uid()
      and uc.company_id = company_uuid
      and uc.is_admin = true
  ) or public.is_superuser();
$$;

create or replace function public.is_company_member_for_account(account_uuid uuid)
returns boolean
language sql stable
as $$
  select exists(
    select 1
    from public.company_accounts ca
    join public.user_companies uc on uc.company_id = ca.company_id
    where ca.id = account_uuid
      and uc.user_id = auth.uid()
  ) or public.is_superuser();
$$;

create or replace function public.is_company_admin_for_account(account_uuid uuid)
returns boolean
language sql stable
as $$
  select exists(
    select 1
    from public.company_accounts ca
    join public.user_companies uc on uc.company_id = ca.company_id
    where ca.id = account_uuid
      and uc.user_id = auth.uid()
      and uc.is_admin = true
  ) or public.is_superuser();
$$;

create or replace function public.is_company_ucid_member(company_ucid text)
returns boolean
language sql stable
as $$
  select exists(
    select 1
    from public.companies c
    join public.user_companies uc on uc.company_id = c.id
    where c.ucid = company_ucid
      and uc.user_id = auth.uid()
  ) or public.is_superuser();
$$;

-- Users
alter table public.users enable row level security;
create policy "Users can view own profile"
  on public.users for select
  using (id = auth.uid() or public.is_superuser());
create policy "Users can insert own profile"
  on public.users for insert
  with check (id = auth.uid() or public.is_superuser());
create policy "Users can update own profile"
  on public.users for update
  using (id = auth.uid() or public.is_superuser())
  with check (id = auth.uid() or public.is_superuser());
create policy "Superusers can delete users"
  on public.users for delete
  using (public.is_superuser());

-- User companies
alter table public.user_companies enable row level security;
create policy "User companies read"
  on public.user_companies for select
  using (user_id = auth.uid() or public.is_superuser());
create policy "User companies insert self"
  on public.user_companies for insert
  with check (
    user_id = auth.uid()
    or public.is_superuser()
    or public.is_company_admin(company_id)
  );
create policy "User companies update delete"
  on public.user_companies for update
  using (public.is_superuser() or public.is_company_admin(company_id))
  with check (public.is_superuser() or public.is_company_admin(company_id));
create policy "User companies delete"
  on public.user_companies for delete
  using (public.is_superuser() or public.is_company_admin(company_id));

-- Companies
alter table public.companies enable row level security;
create policy "Companies select"
  on public.companies for select
  using (public.is_company_member(id));
create policy "Companies insert"
  on public.companies for insert
  with check (auth.uid() is not null);
create policy "Companies update"
  on public.companies for update
  using (public.is_company_admin(id))
  with check (public.is_company_admin(id));
create policy "Companies delete"
  on public.companies for delete
  using (public.is_company_admin(id));

-- Company accounts
alter table public.company_accounts enable row level security;
create policy "Company accounts select"
  on public.company_accounts for select
  using (public.is_company_member(company_id));
create policy "Company accounts write"
  on public.company_accounts for all
  using (public.is_company_admin(company_id))
  with check (public.is_company_admin(company_id));

-- Account mappings
alter table public.account_mappings enable row level security;
create policy "Account mappings select"
  on public.account_mappings for select
  using (public.is_company_member_for_account(company_account_id));
create policy "Account mappings write"
  on public.account_mappings for all
  using (public.is_company_admin_for_account(company_account_id))
  with check (public.is_company_admin_for_account(company_account_id));

-- Legacy mappings
alter table public.mappings enable row level security;
create policy "Mappings select"
  on public.mappings for select
  using (public.is_company_member_for_account(company_account_id));
create policy "Mappings write"
  on public.mappings for all
  using (public.is_company_admin_for_account(company_account_id))
  with check (public.is_company_admin_for_account(company_account_id));

-- QuickBooks tokens
alter table public.qbo_tokens enable row level security;
create policy "QBO tokens select"
  on public.qbo_tokens for select
  using (public.is_company_member(company_id));
create policy "QBO tokens write"
  on public.qbo_tokens for all
  using (public.is_company_admin(company_id))
  with check (public.is_company_admin(company_id));

-- Embeddings
alter table public.embeddings enable row level security;
create policy "Embeddings select"
  on public.embeddings for select
  using (public.is_company_ucid_member(company_ucid));
create policy "Embeddings write"
  on public.embeddings for all
  using (public.is_company_ucid_member(company_ucid))
  with check (public.is_company_ucid_member(company_ucid));

-- COA versions
alter table public.coa_versions enable row level security;
create policy "COA versions select"
  on public.coa_versions for select
  using (company_ucid is null or public.is_company_ucid_member(company_ucid));
create policy "COA versions write"
  on public.coa_versions for all
  using (company_ucid is null or public.is_company_ucid_member(company_ucid))
  with check (company_ucid is null or public.is_company_ucid_member(company_ucid));

-- Import history
alter table public.import_history enable row level security;
create policy "Import history select"
  on public.import_history for select
  using (company_ucid is null or public.is_company_ucid_member(company_ucid));
create policy "Import history write"
  on public.import_history for all
  using (company_ucid is null or public.is_company_ucid_member(company_ucid))
  with check (company_ucid is null or public.is_company_ucid_member(company_ucid));

-- Audit logs
alter table public.audit_logs enable row level security;
create policy "Audit logs select"
  on public.audit_logs for select
  using (public.is_superuser() or user_id = auth.uid()::text);
create policy "Audit logs insert"
  on public.audit_logs for insert
  with check (auth.uid() is not null);

-- Master accounts (global)
alter table public.master_accounts enable row level security;
create policy "Master accounts select"
  on public.master_accounts for select
  using (auth.uid() is not null);
create policy "Master accounts write"
  on public.master_accounts for all
  using (public.is_superuser())
  with check (public.is_superuser());

-- Templates
alter table public.coa_templates enable row level security;
create policy "Templates select"
  on public.coa_templates for select
  using (auth.uid() is not null);
create policy "Templates write"
  on public.coa_templates for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Snapshots
alter table public.coa_snapshots enable row level security;
create policy "Snapshots select"
  on public.coa_snapshots for select
  using (auth.uid() is not null);
create policy "Snapshots write"
  on public.coa_snapshots for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Organizer memory
alter table public.organizer_memory enable row level security;
create policy "Organizer memory select"
  on public.organizer_memory for select
  using (auth.uid() is not null);
create policy "Organizer memory write"
  on public.organizer_memory for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Organizer rules
alter table public.organizer_rules enable row level security;
create policy "Organizer rules select"
  on public.organizer_rules for select
  using (auth.uid() is not null);
create policy "Organizer rules write"
  on public.organizer_rules for all
  using (public.is_superuser())
  with check (public.is_superuser());

-- System settings
alter table public.system_settings enable row level security;
create policy "System settings select"
  on public.system_settings for select
  using (auth.uid() is not null);
create policy "System settings write"
  on public.system_settings for all
  using (public.is_superuser())
  with check (public.is_superuser());

-- User database configs (legacy)
alter table public.user_database_configs enable row level security;
create policy "User database configs select"
  on public.user_database_configs for select
  using (user_id = auth.uid() or public.is_superuser());
create policy "User database configs write"
  on public.user_database_configs for all
  using (user_id = auth.uid() or public.is_superuser())
  with check (user_id = auth.uid() or public.is_superuser());
