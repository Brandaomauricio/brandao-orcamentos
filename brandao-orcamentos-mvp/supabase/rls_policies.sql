-- Row Level Security policies - Brandao Orcamentos
-- Versao alinhada ao banco atual: public.quotes e public.quote_items.

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

create policy "Users can select own profiles"
on public.profiles for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own profiles"
on public.profiles for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own profiles"
on public.profiles for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own profiles"
on public.profiles for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "Public can select profiles for enabled proposals" on public.profiles;

create policy "Public can select profiles for enabled proposals"
on public.profiles for select
to anon
using (
  exists (
    select 1
    from public.quotes
    where quotes.user_id = profiles.user_id
      and quotes.public_link_enabled = true
      and quotes.public_token is not null
  )
);

drop policy if exists "Users can select own clients" on public.clients;
drop policy if exists "Users can insert own clients" on public.clients;
drop policy if exists "Users can update own clients" on public.clients;
drop policy if exists "Users can delete own clients" on public.clients;

create policy "Users can select own clients"
on public.clients for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own clients"
on public.clients for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own clients"
on public.clients for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own clients"
on public.clients for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "Public can select clients for enabled proposals" on public.clients;

create policy "Public can select clients for enabled proposals"
on public.clients for select
to anon
using (
  exists (
    select 1
    from public.quotes
    where quotes.client_id = clients.id
      and quotes.public_link_enabled = true
      and quotes.public_token is not null
  )
);

drop policy if exists "Users can select own services" on public.services;
drop policy if exists "Users can insert own services" on public.services;
drop policy if exists "Users can update own services" on public.services;
drop policy if exists "Users can delete own services" on public.services;

create policy "Users can select own services"
on public.services for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own services"
on public.services for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own services"
on public.services for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own services"
on public.services for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can select own quotes" on public.quotes;
drop policy if exists "Users can insert own quotes" on public.quotes;
drop policy if exists "Users can update own quotes" on public.quotes;
drop policy if exists "Users can delete own quotes" on public.quotes;

create policy "Users can select own quotes"
on public.quotes for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own quotes"
on public.quotes for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own quotes"
on public.quotes for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own quotes"
on public.quotes for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "Public can select enabled proposals" on public.quotes;

create policy "Public can select enabled proposals"
on public.quotes for select
to anon
using (public_link_enabled = true and public_token is not null);

drop policy if exists "Users can select own quote items" on public.quote_items;
drop policy if exists "Users can insert own quote items" on public.quote_items;
drop policy if exists "Users can update own quote items" on public.quote_items;
drop policy if exists "Users can delete own quote items" on public.quote_items;

create policy "Users can select own quote items"
on public.quote_items for select
to authenticated
using (
  exists (
    select 1
    from public.quotes
    where quotes.id = quote_items.quote_id
      and quotes.user_id = auth.uid()
  )
);

create policy "Users can insert own quote items"
on public.quote_items for insert
to authenticated
with check (
  exists (
    select 1
    from public.quotes
    where quotes.id = quote_items.quote_id
      and quotes.user_id = auth.uid()
  )
);

create policy "Users can update own quote items"
on public.quote_items for update
to authenticated
using (
  exists (
    select 1
    from public.quotes
    where quotes.id = quote_items.quote_id
      and quotes.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.quotes
    where quotes.id = quote_items.quote_id
      and quotes.user_id = auth.uid()
  )
);

create policy "Users can delete own quote items"
on public.quote_items for delete
to authenticated
using (
  exists (
    select 1
    from public.quotes
    where quotes.id = quote_items.quote_id
      and quotes.user_id = auth.uid()
  )
);

drop policy if exists "Public can select items from enabled proposals" on public.quote_items;

create policy "Public can select items from enabled proposals"
on public.quote_items for select
to anon
using (
  exists (
    select 1
    from public.quotes
    where quotes.id = quote_items.quote_id
      and quotes.public_link_enabled = true
      and quotes.public_token is not null
  )
);

drop policy if exists "Users can select own quote peripherals" on public.quote_peripherals;
drop policy if exists "Users can insert own quote peripherals" on public.quote_peripherals;
drop policy if exists "Users can update own quote peripherals" on public.quote_peripherals;
drop policy if exists "Users can delete own quote peripherals" on public.quote_peripherals;

create policy "Users can select own quote peripherals"
on public.quote_peripherals for select
to authenticated
using (
  exists (
    select 1
    from public.quotes
    where quotes.id = quote_peripherals.quote_id
      and quotes.user_id = auth.uid()
  )
);

create policy "Users can insert own quote peripherals"
on public.quote_peripherals for insert
to authenticated
with check (
  exists (
    select 1
    from public.quotes
    where quotes.id = quote_peripherals.quote_id
      and quotes.user_id = auth.uid()
  )
);

create policy "Users can update own quote peripherals"
on public.quote_peripherals for update
to authenticated
using (
  exists (
    select 1
    from public.quotes
    where quotes.id = quote_peripherals.quote_id
      and quotes.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.quotes
    where quotes.id = quote_peripherals.quote_id
      and quotes.user_id = auth.uid()
  )
);

create policy "Users can delete own quote peripherals"
on public.quote_peripherals for delete
to authenticated
using (
  exists (
    select 1
    from public.quotes
    where quotes.id = quote_peripherals.quote_id
      and quotes.user_id = auth.uid()
  )
);

drop policy if exists "Public can select peripherals from enabled proposals" on public.quote_peripherals;

create policy "Public can select peripherals from enabled proposals"
on public.quote_peripherals for select
to anon
using (
  exists (
    select 1
    from public.quotes
    where quotes.id = quote_peripherals.quote_id
      and quotes.public_link_enabled = true
      and quotes.public_token is not null
  )
);

drop policy if exists "Users can select own appointments" on public.appointments;
drop policy if exists "Users can insert own appointments" on public.appointments;
drop policy if exists "Users can update own appointments" on public.appointments;
drop policy if exists "Users can delete own appointments" on public.appointments;

create policy "Users can select own appointments"
on public.appointments for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own appointments"
on public.appointments for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own appointments"
on public.appointments for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own appointments"
on public.appointments for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can select own and default templates" on public.templates;
drop policy if exists "Users can insert own templates" on public.templates;
drop policy if exists "Users can update own templates" on public.templates;
drop policy if exists "Users can delete own templates" on public.templates;

create policy "Users can select own and default templates"
on public.templates for select
to authenticated
using (user_id = auth.uid() or user_id is null or is_default = true);

create policy "Users can insert own templates"
on public.templates for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own templates"
on public.templates for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own templates"
on public.templates for delete
to authenticated
using (user_id = auth.uid());
