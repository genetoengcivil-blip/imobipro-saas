-- IMOBIPRO Phase 2 (trial, billing, logs, backups, scheduling)
-- Run after supabase_schema.sql
create table if not exists public.plans (
  id text primary key,
  name text not null,
  price_cents int not null,
  currency text not null default 'BRL',
  max_properties int,
  max_leads_month int,
  reports_advanced boolean not null default false,
  whatsapp_automation boolean not null default false,
  created_at timestamptz default now()
);

insert into public.plans (id,name,price_cents,max_properties,max_leads_month,reports_advanced,whatsapp_automation)
values
 ('basic','Básico',9700,20,50,false,false),
 ('pro','Profissional',19700,100,200,true,false),
 ('premium','Premium',39700,null,null,true,true)
on conflict (id) do nothing;

create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  plan_id text references public.plans(id),
  status text not null default 'trialing', -- trialing|active|past_due|canceled
  trial_start timestamptz,
  trial_end timestamptz,
  mp_subscription_id text,
  mp_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  provider text not null default 'mercadopago',
  provider_payment_id text,
  status text not null, -- paid|failed|pending
  amount_cents int not null,
  currency text not null default 'BRL',
  paid_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  due_at timestamptz,
  status text not null default 'open', -- open|done
  related_lead_id uuid references public.leads(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  related_lead_id uuid references public.leads(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  channel text not null, -- crm|email|whatsapp
  type text not null, -- trial|payment|block
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_user_id uuid,
  target_user_id uuid,
  action text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.backup_runs (
  id uuid primary key default uuid_generate_v4(),
  status text not null default 'queued',
  meta jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now()
);

-- Minimal RLS examples (enable and refine)
alter table public.clients enable row level security;
create policy if not exists "clients_own" on public.clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.tasks enable row level security;
create policy if not exists "tasks_own" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.appointments enable row level security;
create policy if not exists "appointments_own" on public.appointments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

