-- RPC nova para atualizar assinatura no Painel Admin.
-- Execute este arquivo no SQL Editor do Supabase.
-- Nao apaga dados existentes e nao altera propostas, orcamentos, clientes ou agenda.

alter table public.profiles
  add column if not exists current_plan text default 'free',
  add column if not exists subscription_status text default 'active',
  add column if not exists paid_until date,
  add column if not exists plan_started_at timestamptz,
  add column if not exists plan_updated_at timestamptz,
  add column if not exists admin_notes text;

create or replace function public.admin_set_user_subscription_v2(p_user_id uuid, p_action text)
returns table (
  success boolean,
  message text,
  target_user_id uuid,
  current_plan text,
  subscription_status text,
  paid_until date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_email text;
begin
  admin_email := lower(trim(coalesce(auth.jwt() ->> 'email', '')));

  if admin_email not in ('brandaopm14@gmail.com', 'naobrapodcast@gmail.com', 'brandao14@gmail.com') then
    raise exception 'Acesso restrito ao administrador. Email detectado: %', admin_email;
  end if;

  if p_action not in ('activate_30', 'activate_90', 'mark_past_due', 'block', 'free') then
    raise exception 'Acao invalida: %', p_action;
  end if;

  if not exists (select 1 from public.profiles p where p.user_id = p_user_id or p.id = p_user_id) then
    raise exception 'Perfil nao encontrado para user_id: %', p_user_id;
  end if;

  if p_action = 'activate_30' then
    update public.profiles
    set current_plan = 'pro',
        subscription_status = 'active',
        paid_until = current_date + 30,
        plan_started_at = coalesce(plan_started_at, now()),
        plan_updated_at = now(),
        updated_at = now()
    where profiles.user_id = p_user_id or profiles.id = p_user_id;
  elsif p_action = 'activate_90' then
    update public.profiles
    set current_plan = 'pro',
        subscription_status = 'active',
        paid_until = current_date + 90,
        plan_started_at = coalesce(plan_started_at, now()),
        plan_updated_at = now(),
        updated_at = now()
    where profiles.user_id = p_user_id or profiles.id = p_user_id;
  elsif p_action = 'mark_past_due' then
    update public.profiles
    set current_plan = 'pro',
        subscription_status = 'past_due',
        paid_until = current_date - 1,
        plan_updated_at = now(),
        updated_at = now()
    where profiles.user_id = p_user_id or profiles.id = p_user_id;
  elsif p_action = 'block' then
    update public.profiles
    set current_plan = 'pro',
        subscription_status = 'blocked',
        plan_updated_at = now(),
        updated_at = now()
    where profiles.user_id = p_user_id or profiles.id = p_user_id;
  elsif p_action = 'free' then
    update public.profiles
    set current_plan = 'free',
        subscription_status = 'canceled',
        paid_until = null,
        plan_updated_at = now(),
        updated_at = now()
    where profiles.user_id = p_user_id or profiles.id = p_user_id;
  end if;

  return query
  select
    true as success,
    case p_action
      when 'activate_30' then 'Plano Pro ativado/renovado por 30 dias.'
      when 'activate_90' then 'Plano Pro ativado/renovado por 90 dias.'
      when 'mark_past_due' then 'Assinatura marcada como vencida.'
      when 'block' then 'Recursos Pro bloqueados.'
      when 'free' then 'Usuario voltou para o Plano Free.'
      else 'Assinatura atualizada.'
    end as message,
    coalesce(p.user_id, p.id) as target_user_id,
    p.current_plan,
    p.subscription_status,
    p.paid_until
  from public.profiles p
  where p.user_id = p_user_id or p.id = p_user_id
  limit 1;
end;
$$;

create or replace function public.admin_list_profiles_v2()
returns table (
  user_id uuid,
  profile_id uuid,
  professional_name text,
  email text,
  whatsapp text,
  current_plan text,
  subscription_status text,
  paid_until date,
  plan_started_at timestamptz,
  plan_updated_at timestamptz,
  admin_notes text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_email text;
begin
  admin_email := lower(trim(coalesce(auth.jwt() ->> 'email', '')));

  if admin_email not in ('brandaopm14@gmail.com', 'naobrapodcast@gmail.com', 'brandao14@gmail.com') then
    raise exception 'Acesso restrito ao administrador. Email detectado: %', admin_email;
  end if;

  return query
  select
    coalesce(p.user_id, p.id) as user_id,
    p.id as profile_id,
    p.professional_name,
    coalesce(u.email::text, p.email) as email,
    p.whatsapp,
    coalesce(nullif(p.current_plan, ''), 'free') as current_plan,
    case
      when coalesce(nullif(p.current_plan, ''), 'free') = 'pro'
        and p.subscription_status = 'active'
        and p.paid_until is not null
        and p.paid_until < current_date
        then 'past_due'
      else coalesce(nullif(p.subscription_status, ''), 'active')
    end as subscription_status,
    p.paid_until,
    p.plan_started_at,
    p.plan_updated_at,
    p.admin_notes,
    p.created_at
  from public.profiles p
  left join auth.users u on u.id = coalesce(p.user_id, p.id)
  order by p.created_at desc nulls last;
end;
$$;

revoke all on function public.admin_set_user_subscription_v2(uuid, text) from public;
revoke all on function public.admin_list_profiles_v2() from public;
grant execute on function public.admin_set_user_subscription_v2(uuid, text) to authenticated;
grant execute on function public.admin_list_profiles_v2() to authenticated;
