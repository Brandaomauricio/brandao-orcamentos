-- Patch seguro do schema MVP - Brandao Orcamentos
-- Pode ser executado no SQL Editor do Supabase sem apagar dados.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  professional_name text not null default 'Brandao Orcamentos',
  whatsapp text not null default 'Nao informado',
  city text not null default 'Nao informado',
  state text not null default 'BR',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles
  add column if not exists user_id uuid,
  add column if not exists professional_name text,
  add column if not exists responsible_name text,
  add column if not exists whatsapp text,
  add column if not exists email text,
  add column if not exists instagram text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists city_state text,
  add column if not exists document text,
  add column if not exists institutional_note text,
  add column if not exists document_number text,
  add column if not exists address text,
  add column if not exists logo_url text,
  add column if not exists signature_text text,
  add column if not exists default_payment_terms text,
  add column if not exists default_down_payment_value text,
  add column if not exists default_down_payment_percent text,
  add column if not exists default_quote_validity_days text,
  add column if not exists default_execution_deadline text,
  add column if not exists default_commercial_notes text,
  add column if not exists default_approval_text text,
  add column if not exists default_warranty_text text,
  add column if not exists current_plan text default 'free',
  add column if not exists plan_expires_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  whatsapp text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.clients
  add column if not exists user_id uuid,
  add column if not exists name text,
  add column if not exists whatsapp text,
  add column if not exists email text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  unit text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.services
  add column if not exists user_id uuid,
  add column if not exists name text,
  add column if not exists unit text,
  add column if not exists default_price numeric(12,2),
  add column if not exists description text,
  add column if not exists default_description text,
  add column if not exists default_technical_note text,
  add column if not exists category text,
  add column if not exists active boolean default true,
  add column if not exists is_active boolean default true,
  add column if not exists usage_type text default 'all',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  client_id uuid references public.clients(id),
  status text default 'draft',
  total_value numeric(12,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.quotes
  add column if not exists user_id uuid,
  add column if not exists client_id uuid references public.clients(id),
  add column if not exists client_name text,
  add column if not exists client_whatsapp text,
  add column if not exists client_email text,
  add column if not exists client_address text,
  add column if not exists work_address text,
  add column if not exists proposal_number text,
  add column if not exists status text default 'draft',
  add column if not exists issue_date date default current_date,
  add column if not exists valid_until date,
  add column if not exists validity_days integer,
  add column if not exists total_value numeric(12,2) default 0,
  add column if not exists discount_value numeric(12,2) default 0,
  add column if not exists notes text,
  add column if not exists payment_terms text,
  add column if not exists commercial_terms text,
  add column if not exists commercial_conditions text,
  add column if not exists payment_method text,
  add column if not exists down_payment_value numeric(12,2) default 0,
  add column if not exists down_payment_percent numeric(12,2),
  add column if not exists execution_deadline text,
  add column if not exists approval_text text,
  add column if not exists technical_notes text,
  add column if not exists warranty_text text,
  add column if not exists public_token text,
  add column if not exists public_link_enabled boolean default false,
  add column if not exists approved_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete cascade,
  description text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.quote_items
  add column if not exists quote_id uuid references public.quotes(id) on delete cascade,
  add column if not exists service_id uuid references public.services(id),
  add column if not exists service_name text,
  add column if not exists description text,
  add column if not exists unit text,
  add column if not exists unit_price numeric(12,2) default 0,
  add column if not exists quantity numeric(12,2) default 1,
  add column if not exists total_price numeric(12,2) default 0,
  add column if not exists sort_order integer default 0,
  add column if not exists item_type text default 'main',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.quote_peripherals (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.quote_peripherals
  add column if not exists quote_id uuid references public.quotes(id) on delete cascade,
  add column if not exists name text,
  add column if not exists description text,
  add column if not exists unit text,
  add column if not exists unit_price numeric(12,2) default 0,
  add column if not exists quantity numeric(12,2) default 1,
  add column if not exists total_price numeric(12,2) default 0,
  add column if not exists status text,
  add column if not exists price numeric(12,2),
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  type text not null,
  date date not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.appointments
  add column if not exists user_id uuid,
  add column if not exists client_id uuid references public.clients(id),
  add column if not exists quote_id uuid references public.quotes(id),
  add column if not exists title text,
  add column if not exists type text,
  add column if not exists date date,
  add column if not exists start_time time,
  add column if not exists end_time time,
  add column if not exists location text,
  add column if not exists address text,
  add column if not exists notes text,
  add column if not exists status text default 'scheduled',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.templates
  add column if not exists user_id uuid,
  add column if not exists title text,
  add column if not exists category text,
  add column if not exists type text,
  add column if not exists content text,
  add column if not exists is_default boolean default false,
  add column if not exists is_favorite boolean default false,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create unique index if not exists profiles_user_id_key on public.profiles (user_id);
create unique index if not exists quotes_public_token_key on public.quotes (public_token) where public_token is not null;
create index if not exists clients_user_id_idx on public.clients (user_id);
create index if not exists quotes_user_id_idx on public.quotes (user_id);
create index if not exists quotes_client_id_idx on public.quotes (client_id);
create index if not exists quote_items_quote_id_idx on public.quote_items (quote_id);
create index if not exists quote_peripherals_quote_id_idx on public.quote_peripherals (quote_id);
create index if not exists appointments_user_id_idx on public.appointments (user_id);
create index if not exists appointments_date_idx on public.appointments (date);
create index if not exists services_user_id_idx on public.services (user_id);
create index if not exists templates_user_id_idx on public.templates (user_id);

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.services enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.quote_peripherals enable row level security;
alter table public.appointments enable row level security;
alter table public.templates enable row level security;

drop policy if exists "Users can select own profiles" on public.profiles;
drop policy if exists "Users can insert own profiles" on public.profiles;
drop policy if exists "Users can update own profiles" on public.profiles;
drop policy if exists "Users can delete own profiles" on public.profiles;
create policy "Users can select own profiles" on public.profiles for select to authenticated using (user_id = auth.uid());
create policy "Users can insert own profiles" on public.profiles for insert to authenticated with check (user_id = auth.uid());
create policy "Users can update own profiles" on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can delete own profiles" on public.profiles for delete to authenticated using (user_id = auth.uid());

drop policy if exists "Public can select profiles for enabled proposals" on public.profiles;
create policy "Public can select profiles for enabled proposals" on public.profiles for select to anon using (
  exists (select 1 from public.quotes where quotes.user_id = profiles.user_id and quotes.public_link_enabled = true and quotes.public_token is not null)
);

drop policy if exists "Users can select own clients" on public.clients;
drop policy if exists "Users can insert own clients" on public.clients;
drop policy if exists "Users can update own clients" on public.clients;
drop policy if exists "Users can delete own clients" on public.clients;
create policy "Users can select own clients" on public.clients for select to authenticated using (user_id = auth.uid());
create policy "Users can insert own clients" on public.clients for insert to authenticated with check (user_id = auth.uid());
create policy "Users can update own clients" on public.clients for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can delete own clients" on public.clients for delete to authenticated using (user_id = auth.uid());

drop policy if exists "Public can select clients for enabled proposals" on public.clients;
create policy "Public can select clients for enabled proposals" on public.clients for select to anon using (
  exists (select 1 from public.quotes where quotes.client_id = clients.id and quotes.public_link_enabled = true and quotes.public_token is not null)
);

drop policy if exists "Users can select own services" on public.services;
drop policy if exists "Users can insert own services" on public.services;
drop policy if exists "Users can update own services" on public.services;
drop policy if exists "Users can delete own services" on public.services;
create policy "Users can select own services" on public.services for select to authenticated using (user_id = auth.uid());
create policy "Users can insert own services" on public.services for insert to authenticated with check (user_id = auth.uid());
create policy "Users can update own services" on public.services for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can delete own services" on public.services for delete to authenticated using (user_id = auth.uid());

drop policy if exists "Users can select own quotes" on public.quotes;
drop policy if exists "Users can insert own quotes" on public.quotes;
drop policy if exists "Users can update own quotes" on public.quotes;
drop policy if exists "Users can delete own quotes" on public.quotes;
create policy "Users can select own quotes" on public.quotes for select to authenticated using (user_id = auth.uid());
create policy "Users can insert own quotes" on public.quotes for insert to authenticated with check (user_id = auth.uid());
create policy "Users can update own quotes" on public.quotes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can delete own quotes" on public.quotes for delete to authenticated using (user_id = auth.uid());

drop policy if exists "Public can select enabled proposals" on public.quotes;
create policy "Public can select enabled proposals" on public.quotes for select to anon using (
  public_link_enabled = true and public_token is not null
);

drop policy if exists "Users can select own quote items" on public.quote_items;
drop policy if exists "Users can insert own quote items" on public.quote_items;
drop policy if exists "Users can update own quote items" on public.quote_items;
drop policy if exists "Users can delete own quote items" on public.quote_items;
create policy "Users can select own quote items" on public.quote_items for select to authenticated using (
  exists (select 1 from public.quotes where quotes.id = quote_items.quote_id and quotes.user_id = auth.uid())
);
create policy "Users can insert own quote items" on public.quote_items for insert to authenticated with check (
  exists (select 1 from public.quotes where quotes.id = quote_items.quote_id and quotes.user_id = auth.uid())
);
create policy "Users can update own quote items" on public.quote_items for update to authenticated using (
  exists (select 1 from public.quotes where quotes.id = quote_items.quote_id and quotes.user_id = auth.uid())
) with check (
  exists (select 1 from public.quotes where quotes.id = quote_items.quote_id and quotes.user_id = auth.uid())
);
create policy "Users can delete own quote items" on public.quote_items for delete to authenticated using (
  exists (select 1 from public.quotes where quotes.id = quote_items.quote_id and quotes.user_id = auth.uid())
);

drop policy if exists "Public can select items from enabled proposals" on public.quote_items;
create policy "Public can select items from enabled proposals" on public.quote_items for select to anon using (
  exists (select 1 from public.quotes where quotes.id = quote_items.quote_id and quotes.public_link_enabled = true and quotes.public_token is not null)
);

drop policy if exists "Users can select own quote peripherals" on public.quote_peripherals;
drop policy if exists "Users can insert own quote peripherals" on public.quote_peripherals;
drop policy if exists "Users can update own quote peripherals" on public.quote_peripherals;
drop policy if exists "Users can delete own quote peripherals" on public.quote_peripherals;
create policy "Users can select own quote peripherals" on public.quote_peripherals for select to authenticated using (
  exists (select 1 from public.quotes where quotes.id = quote_peripherals.quote_id and quotes.user_id = auth.uid())
);
create policy "Users can insert own quote peripherals" on public.quote_peripherals for insert to authenticated with check (
  exists (select 1 from public.quotes where quotes.id = quote_peripherals.quote_id and quotes.user_id = auth.uid())
);
create policy "Users can update own quote peripherals" on public.quote_peripherals for update to authenticated using (
  exists (select 1 from public.quotes where quotes.id = quote_peripherals.quote_id and quotes.user_id = auth.uid())
) with check (
  exists (select 1 from public.quotes where quotes.id = quote_peripherals.quote_id and quotes.user_id = auth.uid())
);
create policy "Users can delete own quote peripherals" on public.quote_peripherals for delete to authenticated using (
  exists (select 1 from public.quotes where quotes.id = quote_peripherals.quote_id and quotes.user_id = auth.uid())
);

drop policy if exists "Public can select peripherals from enabled proposals" on public.quote_peripherals;
create policy "Public can select peripherals from enabled proposals" on public.quote_peripherals for select to anon using (
  exists (select 1 from public.quotes where quotes.id = quote_peripherals.quote_id and quotes.public_link_enabled = true and quotes.public_token is not null)
);

drop policy if exists "Users can select own appointments" on public.appointments;
drop policy if exists "Users can insert own appointments" on public.appointments;
drop policy if exists "Users can update own appointments" on public.appointments;
drop policy if exists "Users can delete own appointments" on public.appointments;
create policy "Users can select own appointments" on public.appointments for select to authenticated using (user_id = auth.uid());
create policy "Users can insert own appointments" on public.appointments for insert to authenticated with check (user_id = auth.uid());
create policy "Users can update own appointments" on public.appointments for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can delete own appointments" on public.appointments for delete to authenticated using (user_id = auth.uid());

drop policy if exists "Users can select own and default templates" on public.templates;
drop policy if exists "Users can insert own templates" on public.templates;
drop policy if exists "Users can update own templates" on public.templates;
drop policy if exists "Users can delete own templates" on public.templates;
create policy "Users can select own and default templates" on public.templates for select to authenticated using (
  user_id = auth.uid() or user_id is null or is_default = true
);
create policy "Users can insert own templates" on public.templates for insert to authenticated with check (user_id = auth.uid());
create policy "Users can update own templates" on public.templates for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can delete own templates" on public.templates for delete to authenticated using (user_id = auth.uid());
