create extension if not exists "uuid-ossp";

create table if not exists public.tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  plan text default 'basico',
  active boolean default true,
  created_at timestamp with time zone default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'corretor',
  tenant_id uuid references public.tenants(id),
  created_at timestamp with time zone default now()
);

create table if not exists public.properties (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  title text,
  description text,
  price numeric,
  status text,
  created_at timestamp with time zone default now()
);

create table if not exists public.leads (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  name text,
  email text,
  phone text,
  message text,
  created_at timestamp with time zone default now()
);

create table if not exists public.site_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  logo_url text,
  primary_color text,
  domain text
);

create or replace function public.handle_new_user()
returns trigger as $$
declare
  tenant_uuid uuid;
  slug_base text;
begin
  slug_base := lower(regexp_replace(new.email, '[^a-zA-Z0-9]+', '-', 'g'));

  insert into public.tenants (name, slug)
  values (coalesce(new.raw_user_meta_data->>'full_name', new.email), slug_base)
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

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.leads enable row level security;
alter table public.site_settings enable row level security;

-- private policies
drop policy if exists "tenant own data" on public.tenants;
create policy "tenant own data"
on public.tenants for select
using (id in (select tenant_id from public.profiles where user_id = auth.uid()));

drop policy if exists "profile self" on public.profiles;
create policy "profile self"
on public.profiles for select
using (user_id = auth.uid());

drop policy if exists "properties tenant private" on public.properties;
create policy "properties tenant private"
on public.properties for all
using (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()))
with check (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()));

drop policy if exists "leads tenant private" on public.leads;
create policy "leads tenant private"
on public.leads for all
using (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()))
with check (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()));

drop policy if exists "site settings tenant private" on public.site_settings;
create policy "site settings tenant private"
on public.site_settings for all
using (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()))
with check (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()));

-- public read for site by slug
drop policy if exists "tenants public read" on public.tenants;
create policy "tenants public read" on public.tenants for select using (true);

drop policy if exists "properties public read" on public.properties;
create policy "properties public read" on public.properties for select using (true);

drop policy if exists "site settings public read" on public.site_settings;
create policy "site settings public read" on public.site_settings for select using (true);

-- public insert leads (optional)
drop policy if exists "leads public insert" on public.leads;
create policy "leads public insert" on public.leads for insert with check (true);
