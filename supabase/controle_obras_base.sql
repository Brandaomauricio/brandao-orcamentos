-- Base completa do modulo Controle de Obras.
-- Execute no SQL Editor do Supabase.
-- Seguro para rodar mais de uma vez: nao apaga dados existentes e nao usa DROP TABLE.

create extension if not exists pgcrypto;

create table if not exists public.obras_controle (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome_obra text,
  cliente_nome text,
  cliente_telefone text,
  endereco text,
  tipo_piso text,
  metragem_total numeric(12,2),
  valor_fechado numeric(12,2),
  data_inicio date,
  data_previsao_conclusao date,
  status_obra text not null default 'em_andamento',
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.obra_lancamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  obra_id uuid not null references public.obras_controle(id) on delete cascade,
  data_lancamento date,
  tipo text not null,
  categoria text,
  descricao text,
  valor numeric(12,2) not null default 0,
  status text not null default 'pago',
  forma_pagamento text,
  observacao text,
  created_at timestamptz not null default now()
);

create table if not exists public.obra_categorias_financeiras (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  tipo text not null,
  nome text not null,
  ativa boolean not null default true,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.obra_diarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  obra_id uuid not null references public.obras_controle(id) on delete cascade,
  data_relatorio date,
  equipe text,
  atividades_realizadas text,
  problemas_encontrados text,
  pendencias text,
  proxima_etapa text,
  clima text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('obra-diarios', 'obra-diarios', true)
on conflict (id) do update
set public = excluded.public;

create table if not exists public.obra_diario_fotos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  obra_id uuid not null references public.obras_controle(id) on delete cascade,
  diario_id uuid not null references public.obra_diarios(id) on delete cascade,
  path text not null,
  url text,
  created_at timestamptz not null default now()
);

create index if not exists obras_controle_user_id_idx
  on public.obras_controle (user_id);

create index if not exists obra_lancamentos_user_id_idx
  on public.obra_lancamentos (user_id);

create index if not exists obra_lancamentos_obra_id_idx
  on public.obra_lancamentos (obra_id);

create index if not exists obra_lancamentos_data_lancamento_idx
  on public.obra_lancamentos (data_lancamento);

create index if not exists obra_categorias_financeiras_user_id_idx
  on public.obra_categorias_financeiras (user_id);

create unique index if not exists obra_categorias_financeiras_user_tipo_nome_idx
  on public.obra_categorias_financeiras (coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), tipo, lower(nome));

create index if not exists obra_diarios_user_id_idx
  on public.obra_diarios (user_id);

create index if not exists obra_diarios_obra_id_idx
  on public.obra_diarios (obra_id);

create index if not exists obra_diarios_data_relatorio_idx
  on public.obra_diarios (data_relatorio);

create index if not exists obra_diario_fotos_user_id_idx
  on public.obra_diario_fotos (user_id);

create index if not exists obra_diario_fotos_obra_id_idx
  on public.obra_diario_fotos (obra_id);

create index if not exists obra_diario_fotos_diario_id_idx
  on public.obra_diario_fotos (diario_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists obras_controle_set_updated_at on public.obras_controle;
create trigger obras_controle_set_updated_at
before update on public.obras_controle
for each row
execute function public.set_updated_at();

drop trigger if exists obra_diarios_set_updated_at on public.obra_diarios;
create trigger obra_diarios_set_updated_at
before update on public.obra_diarios
for each row
execute function public.set_updated_at();

alter table public.obras_controle enable row level security;
alter table public.obra_lancamentos enable row level security;
alter table public.obra_categorias_financeiras enable row level security;
alter table public.obra_diarios enable row level security;
alter table public.obra_diario_fotos enable row level security;

drop policy if exists "obras_controle_select_own" on public.obras_controle;
create policy "obras_controle_select_own"
on public.obras_controle
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "obras_controle_insert_own" on public.obras_controle;
create policy "obras_controle_insert_own"
on public.obras_controle
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "obras_controle_update_own" on public.obras_controle;
create policy "obras_controle_update_own"
on public.obras_controle
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "obras_controle_delete_own" on public.obras_controle;
create policy "obras_controle_delete_own"
on public.obras_controle
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "obra_lancamentos_select_own" on public.obra_lancamentos;
create policy "obra_lancamentos_select_own"
on public.obra_lancamentos
for select
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.obras_controle oc
    where oc.id = obra_lancamentos.obra_id
      and oc.user_id = auth.uid()
  )
);

drop policy if exists "obra_lancamentos_insert_own" on public.obra_lancamentos;
create policy "obra_lancamentos_insert_own"
on public.obra_lancamentos
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.obras_controle oc
    where oc.id = obra_lancamentos.obra_id
      and oc.user_id = auth.uid()
  )
);

drop policy if exists "obra_lancamentos_update_own" on public.obra_lancamentos;
create policy "obra_lancamentos_update_own"
on public.obra_lancamentos
for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.obras_controle oc
    where oc.id = obra_lancamentos.obra_id
      and oc.user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.obras_controle oc
    where oc.id = obra_lancamentos.obra_id
      and oc.user_id = auth.uid()
  )
);

drop policy if exists "obra_lancamentos_delete_own" on public.obra_lancamentos;
create policy "obra_lancamentos_delete_own"
on public.obra_lancamentos
for delete
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.obras_controle oc
    where oc.id = obra_lancamentos.obra_id
      and oc.user_id = auth.uid()
  )
);

drop policy if exists "obra_categorias_financeiras_select_own_or_default" on public.obra_categorias_financeiras;
create policy "obra_categorias_financeiras_select_own_or_default"
on public.obra_categorias_financeiras
for select
to authenticated
using (user_id = auth.uid() or user_id is null);

drop policy if exists "obra_categorias_financeiras_insert_own" on public.obra_categorias_financeiras;
create policy "obra_categorias_financeiras_insert_own"
on public.obra_categorias_financeiras
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "obra_categorias_financeiras_update_own" on public.obra_categorias_financeiras;
create policy "obra_categorias_financeiras_update_own"
on public.obra_categorias_financeiras
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "obra_categorias_financeiras_delete_own" on public.obra_categorias_financeiras;
create policy "obra_categorias_financeiras_delete_own"
on public.obra_categorias_financeiras
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "obra_diarios_select_own" on public.obra_diarios;
create policy "obra_diarios_select_own"
on public.obra_diarios
for select
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.obras_controle oc
    where oc.id = obra_diarios.obra_id
      and oc.user_id = auth.uid()
  )
);

drop policy if exists "obra_diarios_insert_own" on public.obra_diarios;
create policy "obra_diarios_insert_own"
on public.obra_diarios
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.obras_controle oc
    where oc.id = obra_diarios.obra_id
      and oc.user_id = auth.uid()
  )
);

drop policy if exists "obra_diarios_update_own" on public.obra_diarios;
create policy "obra_diarios_update_own"
on public.obra_diarios
for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.obras_controle oc
    where oc.id = obra_diarios.obra_id
      and oc.user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.obras_controle oc
    where oc.id = obra_diarios.obra_id
      and oc.user_id = auth.uid()
  )
);

drop policy if exists "obra_diarios_delete_own" on public.obra_diarios;
create policy "obra_diarios_delete_own"
on public.obra_diarios
for delete
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.obras_controle oc
    where oc.id = obra_diarios.obra_id
      and oc.user_id = auth.uid()
  )
);

drop policy if exists "obra_diario_fotos_select_own" on public.obra_diario_fotos;
create policy "obra_diario_fotos_select_own"
on public.obra_diario_fotos
for select
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.obras_controle oc
    where oc.id = obra_diario_fotos.obra_id
      and oc.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.obra_diarios od
    where od.id = obra_diario_fotos.diario_id
      and od.obra_id = obra_diario_fotos.obra_id
      and od.user_id = auth.uid()
  )
);

drop policy if exists "obra_diario_fotos_insert_own" on public.obra_diario_fotos;
create policy "obra_diario_fotos_insert_own"
on public.obra_diario_fotos
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.obras_controle oc
    where oc.id = obra_diario_fotos.obra_id
      and oc.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.obra_diarios od
    where od.id = obra_diario_fotos.diario_id
      and od.obra_id = obra_diario_fotos.obra_id
      and od.user_id = auth.uid()
  )
);

drop policy if exists "obra_diario_fotos_update_own" on public.obra_diario_fotos;
create policy "obra_diario_fotos_update_own"
on public.obra_diario_fotos
for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.obras_controle oc
    where oc.id = obra_diario_fotos.obra_id
      and oc.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.obra_diarios od
    where od.id = obra_diario_fotos.diario_id
      and od.obra_id = obra_diario_fotos.obra_id
      and od.user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.obras_controle oc
    where oc.id = obra_diario_fotos.obra_id
      and oc.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.obra_diarios od
    where od.id = obra_diario_fotos.diario_id
      and od.obra_id = obra_diario_fotos.obra_id
      and od.user_id = auth.uid()
  )
);

drop policy if exists "obra_diario_fotos_delete_own" on public.obra_diario_fotos;
create policy "obra_diario_fotos_delete_own"
on public.obra_diario_fotos
for delete
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.obras_controle oc
    where oc.id = obra_diario_fotos.obra_id
      and oc.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.obra_diarios od
    where od.id = obra_diario_fotos.diario_id
      and od.obra_id = obra_diario_fotos.obra_id
      and od.user_id = auth.uid()
  )
);

drop policy if exists "obra_diarios_storage_select_own" on storage.objects;
create policy "obra_diarios_storage_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'obra-diarios'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "obra_diarios_storage_insert_own" on storage.objects;
create policy "obra_diarios_storage_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'obra-diarios'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "obra_diarios_storage_update_own" on storage.objects;
create policy "obra_diarios_storage_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'obra-diarios'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'obra-diarios'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "obra_diarios_storage_delete_own" on storage.objects;
create policy "obra_diarios_storage_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'obra-diarios'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace view public.resumo_obras_financeiro as
select
  oc.id as obra_id,
  oc.user_id,
  coalesce(oc.valor_fechado, 0)::numeric(12,2) as valor_fechado,
  coalesce(sum(ol.valor) filter (
    where lower(coalesce(ol.tipo, '')) = 'entrada'
      and lower(coalesce(ol.status, '')) in ('pago', 'recebido')
  ), 0)::numeric(12,2) as entradas_recebidas,
  coalesce(sum(ol.valor) filter (
    where lower(coalesce(ol.tipo, '')) = 'saida'
      and lower(coalesce(ol.status, '')) in ('pago', 'recebido')
  ), 0)::numeric(12,2) as saidas_pagas,
  (
    coalesce(sum(ol.valor) filter (
      where lower(coalesce(ol.tipo, '')) = 'entrada'
        and lower(coalesce(ol.status, '')) in ('pago', 'recebido')
    ), 0)
    -
    coalesce(sum(ol.valor) filter (
      where lower(coalesce(ol.tipo, '')) = 'saida'
        and lower(coalesce(ol.status, '')) in ('pago', 'recebido')
    ), 0)
  )::numeric(12,2) as saldo_realizado,
  coalesce(sum(ol.valor) filter (
    where lower(coalesce(ol.tipo, '')) = 'entrada'
      and lower(coalesce(ol.status, '')) = 'pendente'
  ), 0)::numeric(12,2) as valor_a_receber,
  coalesce(sum(ol.valor) filter (
    where lower(coalesce(ol.tipo, '')) = 'saida'
      and lower(coalesce(ol.status, '')) = 'pendente'
  ), 0)::numeric(12,2) as valor_a_pagar,
  (
    coalesce(oc.valor_fechado, 0)
    -
    coalesce(sum(ol.valor) filter (
      where lower(coalesce(ol.tipo, '')) = 'saida'
        and lower(coalesce(ol.status, '')) in ('pago', 'recebido', 'pendente')
    ), 0)
  )::numeric(12,2) as resultado_previsto
from public.obras_controle oc
left join public.obra_lancamentos ol
  on ol.obra_id = oc.id
 and ol.user_id = oc.user_id
 and lower(coalesce(ol.status, '')) <> 'cancelado'
where oc.user_id = auth.uid()
group by oc.id, oc.user_id, oc.valor_fechado;

grant select on public.resumo_obras_financeiro to authenticated;

insert into public.obra_categorias_financeiras (user_id, tipo, nome, ativa, ordem)
values
  (null, 'saida', 'Mao de obra', true, 10),
  (null, 'saida', 'Combustivel/Deslocamento', true, 20),
  (null, 'saida', 'Material', true, 30),
  (null, 'saida', 'Alimentacao', true, 40),
  (null, 'saida', 'Taxas/Impostos', true, 50),
  (null, 'entrada', 'Servico adicional', true, 60),
  (null, 'entrada', 'Parcela recebida', true, 70)
on conflict (coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), tipo, lower(nome))
do update
set ativa = excluded.ativa,
    ordem = excluded.ordem;
