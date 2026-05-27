-- Schema inicial do MVP — Brandão Orçamentos
-- Execute no SQL Editor do Supabase depois de criar o projeto.

create table if not exists public.users_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  professional_name text not null,
  responsible_name text,
  whatsapp text not null,
  email text,
  instagram text,
  city text not null,
  state text not null,
  document_number text,
  address text,
  logo_url text,
  signature_text text,
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
  default_description text,
  default_technical_note text,
  usage_type text default 'all',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  client_id uuid references public.clients(id),
  proposal_number text,
  status text default 'draft',
  issue_date date default current_date,
  valid_until date,
  total_value numeric(12,2) default 0,
  discount_value numeric(12,2) default 0,
  down_payment_value numeric(12,2) default 0,
  payment_terms text,
  warranty_text text,
  commercial_conditions text,
  technical_notes text,
  public_token text unique,
  public_link_enabled boolean default false,
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid references public.budgets(id) on delete cascade,
  service_id uuid references public.services(id),
  description text not null,
  unit text,
  unit_price numeric(12,2) default 0,
  quantity numeric(12,2) default 1,
  total_price numeric(12,2) default 0,
  item_type text default 'main',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.budget_peripherals (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid references public.budgets(id) on delete cascade,
  name text not null,
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
  budget_id uuid references public.budgets(id),
  type text not null,
  title text not null,
  date date not null,
  start_time time,
  end_time time,
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
  title text not null,
  content text not null,
  is_favorite boolean default false,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
