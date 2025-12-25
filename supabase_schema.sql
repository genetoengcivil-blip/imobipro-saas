create extension if not exists "uuid-ossp";

/* =========================
   TENANTS
========================= */
create table if not exists public.tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  plan text default 'trial',
  trial_start timestamptz default now(),
  trial_end timestamptz default (now() + interval '14 days'),
  active boolean default true,
  created_at timestamptz default now()
);

/* =========================
   PROFILES
========================= */
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text default 'corretor',
  tenant_id uuid references public.tenants(id) on delete cascade,
  created_at timestamptz default now()
);

/* =========================
   SITE SETTINGS
========================= */
create table if not exists public.site_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  logo_url text,
  primary_color text,
  domain text
);

/* =========================
   PROPERTIES
========================= */
create table if not exists public.properties (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  title text,
  description text,
  price numeric,
  created_at timestamptz default now()
);

/* =========================
   LEADS
========================= */
create table if not exists public.leads (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  name text,
  email text,
  phone text,
  message text,
  created_at timestamptz default now()
);

/* =========================
   TRIGGER
========================= */
create or replace function public.handle_new_user()
returns trigger as $$
declare
  tenant_uuid uuid;
  slug_base text;
begin
  slug_base := split_part(new.email, '@', 1);

  insert into public.tenants (name, slug)
  values (new.email, slug_base)
  returning id into tenant_uuid;

  insert into public.profiles (user_id, tenant_id, role)
  values (new.id, tenant_uuid, 'corretor');

  insert into public.site_settings (tenant_id)
  values (tenant_uuid);

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

/* =========================
   RLS
========================= */
alter table tenants enable row level security;
alter table profiles enable row level security;
alter table properties enable row level security;
alter table leads enable row level security;
alter table site_settings enable row level security;

create policy "tenant_read"
on tenants for select
using (id in (select tenant_id from profiles where user_id = auth.uid()));

create policy "profile_self"
on profiles for select
using (user_id = auth.uid());

create policy "tenant_data"
on properties for all
using (tenant_id in (select tenant_id from profiles where user_id = auth.uid()));

create policy "leads_data"
on leads for all
using (tenant_id in (select tenant_id from profiles where user_id = auth.uid()));

create policy "settings_data"
on site_settings for all
using (tenant_id in (select tenant_id from profiles where user_id = auth.uid()));

-- site público pode ler settings e properties
create policy "public_site"
on site_settings for select
using (true);

create policy "public_properties"
on properties for select
using (true);
