-- Schema inicial do MVP — Brandão Orçamentos
-- Execute no SQL Editor do Supabase depois de criar o projeto.

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  professional_name text not null,
  responsible_name text,
  whatsapp text not null,
  email text,
  instagram text,
  city text not null,
  state text not null,
  city_state text,
  document text,
  institutional_note text,
  document_number text,
  address text,
  logo_url text,
  signature_text text,
  default_payment_terms text,
  default_down_payment_value text,
  default_down_payment_percent text,
  default_quote_validity_days text,
  default_execution_deadline text,
  default_commercial_notes text,
  default_approval_text text,
  default_warranty_text text,
  current_plan text default 'free',
  plan_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  whatsapp text not null,
  email text,
  address text,
  city text,
  state text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  category text,
  unit text not null,
  default_price numeric(12,2),
  description text,
  default_description text,
  default_technical_note text,
  usage_type text default 'all',
  active boolean default true,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  client_id uuid references public.clients(id),
  client_name text,
  client_whatsapp text,
  client_email text,
  client_address text,
  work_address text,
  proposal_number text,
  status text default 'draft',
  issue_date date default current_date,
  valid_until date,
  validity_days integer,
  total_value numeric(12,2) default 0,
  discount_value numeric(12,2) default 0,
  down_payment_value numeric(12,2) default 0,
  down_payment_percent numeric(12,2),
  payment_terms text,
  commercial_terms text,
  payment_method text,
  warranty_text text,
  commercial_conditions text,
  execution_deadline text,
  approval_text text,
  notes text,
  technical_notes text,
  public_token text unique,
  public_link_enabled boolean default false,
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete cascade,
  service_id uuid references public.services(id),
  service_name text,
  description text not null,
  unit text,
  unit_price numeric(12,2) default 0,
  quantity numeric(12,2) default 1,
  total_price numeric(12,2) default 0,
  sort_order integer default 0,
  item_type text default 'main',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.quote_peripherals (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete cascade,
  name text not null,
  description text,
  unit text,
  unit_price numeric(12,2) default 0,
  quantity numeric(12,2) default 1,
  total_price numeric(12,2) default 0,
  status text not null,
  price numeric(12,2),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  client_id uuid references public.clients(id),
  quote_id uuid references public.quotes(id),
  type text not null,
  title text not null,
  date date not null,
  start_time time,
  end_time time,
  location text,
  address text,
  status text default 'scheduled',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  type text not null,
  category text,
  title text not null,
  content text not null,
  is_favorite boolean default false,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
