-- Controle de assinatura do Plano Pro.
-- Execute este arquivo no SQL Editor do Supabase.

alter table public.profiles
  add column if not exists current_plan text default 'free',
  add column if not exists subscription_status text default 'active',
  add column if not exists paid_until date,
  add column if not exists plan_started_at timestamptz,
  add column if not exists plan_updated_at timestamptz,
  add column if not exists admin_notes text;

update public.profiles
set current_plan = 'free'
where current_plan is null or trim(current_plan) = '';

update public.profiles
set subscription_status = 'active'
where subscription_status is null or trim(subscription_status) = '';

alter table public.profiles
  alter column current_plan set default 'free',
  alter column subscription_status set default 'active';

create index if not exists profiles_subscription_idx
  on public.profiles (user_id, current_plan, subscription_status, paid_until);

create or replace function public.is_ob_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(trim(coalesce(auth.jwt() ->> 'email', ''))) in (
    'brandaopm14@gmail.com',
    'naobrapodcast@gmail.com',
    'brandao14@gmail.com'
  );
$$;

create or replace function public.admin_list_profiles()
returns table (
  profile_id uuid,
  user_id uuid,
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
begin
  if not public.is_ob_admin() then
    raise exception 'Acesso restrito ao administrador.';
  end if;

  return query
  select
    p.id as profile_id,
    p.user_id,
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
  left join auth.users u on u.id = p.user_id
  order by p.created_at desc nulls last;
end;
$$;

create or replace function public.admin_update_subscription(p_user_id uuid, p_action text)
returns table (
  profile_id uuid,
  user_id uuid,
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
  next_paid_until date;
begin
  if not public.is_ob_admin() then
    raise exception 'Acesso restrito ao administrador.';
  end if;

  if p_action not in ('activate_30', 'activate_90', 'mark_active', 'mark_past_due', 'block', 'free') then
    raise exception 'Acao invalida.';
  end if;

  if p_action = 'activate_30' then
    next_paid_until := current_date + 30;
    update public.profiles
    set current_plan = 'pro',
        subscription_status = 'active',
        paid_until = next_paid_until,
        plan_started_at = coalesce(plan_started_at, now()),
        plan_updated_at = now(),
        updated_at = now()
    where profiles.user_id = p_user_id;
  elsif p_action = 'activate_90' then
    next_paid_until := current_date + 90;
    update public.profiles
    set current_plan = 'pro',
        subscription_status = 'active',
        paid_until = next_paid_until,
        plan_started_at = coalesce(plan_started_at, now()),
        plan_updated_at = now(),
        updated_at = now()
    where profiles.user_id = p_user_id;
  elsif p_action = 'mark_active' then
    update public.profiles
    set current_plan = 'pro',
        subscription_status = 'active',
        paid_until = current_date + 30,
        plan_started_at = coalesce(plan_started_at, now()),
        plan_updated_at = now(),
        updated_at = now()
    where profiles.user_id = p_user_id;
  elsif p_action = 'mark_past_due' then
    update public.profiles
    set subscription_status = 'past_due',
        paid_until = current_date - 1,
        plan_updated_at = now(),
        updated_at = now()
    where profiles.user_id = p_user_id;
  elsif p_action = 'block' then
    update public.profiles
    set subscription_status = 'blocked',
        plan_updated_at = now(),
        updated_at = now()
    where profiles.user_id = p_user_id;
  elsif p_action = 'free' then
    update public.profiles
    set current_plan = 'free',
        subscription_status = 'active',
        paid_until = null,
        plan_updated_at = now(),
        updated_at = now()
    where profiles.user_id = p_user_id;
  end if;

  if not found then
    raise exception 'Perfil nao encontrado.';
  end if;

  return query
  select *
  from public.admin_list_profiles() alp
  where alp.user_id = p_user_id
  limit 1;
end;
$$;

revoke all on function public.is_ob_admin() from public;
revoke all on function public.admin_list_profiles() from public;
revoke all on function public.admin_update_subscription(uuid, text) from public;

grant execute on function public.is_ob_admin() to authenticated;
grant execute on function public.admin_list_profiles() to authenticated;
grant execute on function public.admin_update_subscription(uuid, text) to authenticated;
