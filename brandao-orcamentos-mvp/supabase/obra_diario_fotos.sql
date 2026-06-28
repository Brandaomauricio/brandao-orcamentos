-- Suporte a fotos no Diario de Obra.
-- Execute este arquivo no SQL Editor do Supabase antes de testar uploads.

insert into storage.buckets (id, name, public)
values ('obra-diarios', 'obra-diarios', true)
on conflict (id) do nothing;

create table if not exists public.obra_diario_fotos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  obra_id uuid not null references public.obras_controle(id) on delete cascade,
  diario_id uuid not null references public.obra_diarios(id) on delete cascade,
  path text not null,
  url text,
  created_at timestamptz not null default now()
);

alter table public.obra_diario_fotos enable row level security;

drop policy if exists "obra_diario_fotos_select_own" on public.obra_diario_fotos;
create policy "obra_diario_fotos_select_own"
on public.obra_diario_fotos
for select
using (auth.uid() = user_id);

drop policy if exists "obra_diario_fotos_insert_own" on public.obra_diario_fotos;
create policy "obra_diario_fotos_insert_own"
on public.obra_diario_fotos
for insert
with check (auth.uid() = user_id);

drop policy if exists "obra_diario_fotos_delete_own" on public.obra_diario_fotos;
create policy "obra_diario_fotos_delete_own"
on public.obra_diario_fotos
for delete
using (auth.uid() = user_id);

drop policy if exists "obra_diarios_storage_select_own" on storage.objects;
create policy "obra_diarios_storage_select_own"
on storage.objects
for select
using (
  bucket_id = 'obra-diarios'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "obra_diarios_storage_insert_own" on storage.objects;
create policy "obra_diarios_storage_insert_own"
on storage.objects
for insert
with check (
  bucket_id = 'obra-diarios'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "obra_diarios_storage_delete_own" on storage.objects;
create policy "obra_diarios_storage_delete_own"
on storage.objects
for delete
using (
  bucket_id = 'obra-diarios'
  and (storage.foldername(name))[1] = auth.uid()::text
);
