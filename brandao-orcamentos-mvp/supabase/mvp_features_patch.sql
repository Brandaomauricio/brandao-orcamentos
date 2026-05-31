-- Patch de features MVP - agenda, servicos e templates.
-- Seguro para rodar no SQL Editor: nao apaga dados.

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
  add column if not exists status text default 'agendado',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.services
  add column if not exists user_id uuid,
  add column if not exists name text,
  add column if not exists unit text,
  add column if not exists default_price numeric(12,2),
  add column if not exists category text,
  add column if not exists description text,
  add column if not exists default_description text,
  add column if not exists active boolean default true,
  add column if not exists is_active boolean default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

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

alter table public.profiles
  add column if not exists current_plan text default 'free';

create index if not exists appointments_user_id_idx on public.appointments (user_id);
create index if not exists appointments_date_idx on public.appointments (date);
create index if not exists services_user_id_idx on public.services (user_id);
create index if not exists templates_user_id_idx on public.templates (user_id);
create index if not exists templates_category_idx on public.templates (category);

alter table public.appointments enable row level security;
alter table public.services enable row level security;
alter table public.templates enable row level security;

drop policy if exists "Users can select own appointments" on public.appointments;
drop policy if exists "Users can insert own appointments" on public.appointments;
drop policy if exists "Users can update own appointments" on public.appointments;
drop policy if exists "Users can delete own appointments" on public.appointments;
create policy "Users can select own appointments" on public.appointments for select to authenticated using (user_id = auth.uid());
create policy "Users can insert own appointments" on public.appointments for insert to authenticated with check (user_id = auth.uid());
create policy "Users can update own appointments" on public.appointments for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can delete own appointments" on public.appointments for delete to authenticated using (user_id = auth.uid());

drop policy if exists "Users can select own services" on public.services;
drop policy if exists "Users can insert own services" on public.services;
drop policy if exists "Users can update own services" on public.services;
drop policy if exists "Users can delete own services" on public.services;
create policy "Users can select own services" on public.services for select to authenticated using (user_id = auth.uid());
create policy "Users can insert own services" on public.services for insert to authenticated with check (user_id = auth.uid());
create policy "Users can update own services" on public.services for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can delete own services" on public.services for delete to authenticated using (user_id = auth.uid());

drop policy if exists "Users can select own and default templates" on public.templates;
drop policy if exists "Users can insert own templates" on public.templates;
drop policy if exists "Users can update own templates" on public.templates;
drop policy if exists "Users can delete own templates" on public.templates;
create policy "Users can select own and default templates" on public.templates for select to authenticated using (user_id = auth.uid() or user_id is null or is_default = true);
create policy "Users can insert own templates" on public.templates for insert to authenticated with check (user_id = auth.uid());
create policy "Users can update own templates" on public.templates for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can delete own templates" on public.templates for delete to authenticated using (user_id = auth.uid());
