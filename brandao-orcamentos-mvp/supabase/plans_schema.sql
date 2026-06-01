-- Estrutura interna dos planos Free e Pro.
-- Execute no SQL Editor do Supabase se o projeto ainda nao tiver o campo current_plan em profiles.

alter table public.profiles
  add column if not exists current_plan text default 'free';

update public.profiles
set current_plan = 'free'
where current_plan is null or trim(current_plan) = '';

alter table public.profiles
  alter column current_plan set default 'free';

create index if not exists profiles_user_plan_idx
  on public.profiles (user_id, current_plan);

-- As policies de profiles devem continuar permitindo que cada usuario autenticado
-- leia e atualize somente o proprio perfil:
-- user_id = auth.uid()
