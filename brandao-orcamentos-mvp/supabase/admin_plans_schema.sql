-- Painel Admin de planos.
-- Execute este arquivo no SQL Editor do Supabase.
-- Ele cria funcoes seguras para listar perfis e alterar planos somente pelos admins autorizados.

alter table public.profiles
  add column if not exists current_plan text default 'free';

update public.profiles
set current_plan = 'free'
where current_plan is null or trim(current_plan) = '';

create or replace function public.is_ob_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) in (
    'brandaopm14@gmail.com',
    'naobrapodcast@gmail.com'
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
    p.created_at
  from public.profiles p
  left join auth.users u on u.id = p.user_id
  order by p.created_at desc nulls last;
end;
$$;

create or replace function public.admin_update_user_plan(p_user_id uuid, p_plan text)
returns table (
  profile_id uuid,
  user_id uuid,
  professional_name text,
  email text,
  whatsapp text,
  current_plan text,
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

  if p_plan not in ('free', 'pro') then
    raise exception 'Plano invalido.';
  end if;

  update public.profiles
  set current_plan = p_plan,
      updated_at = now()
  where profiles.user_id = p_user_id;

  if not found then
    raise exception 'Perfil nao encontrado.';
  end if;

  return query
  select
    p.id as profile_id,
    p.user_id,
    p.professional_name,
    coalesce(u.email::text, p.email) as email,
    p.whatsapp,
    coalesce(nullif(p.current_plan, ''), 'free') as current_plan,
    p.created_at
  from public.profiles p
  left join auth.users u on u.id = p.user_id
  where p.user_id = p_user_id
  limit 1;
end;
$$;

revoke all on function public.is_ob_admin() from public;
revoke all on function public.admin_list_profiles() from public;
revoke all on function public.admin_update_user_plan(uuid, text) from public;

grant execute on function public.is_ob_admin() to authenticated;
grant execute on function public.admin_list_profiles() to authenticated;
grant execute on function public.admin_update_user_plan(uuid, text) to authenticated;
