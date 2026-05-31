-- Compatibilidade do perfil profissional usado em /minha-conta.
-- Execute no SQL Editor do Supabase em projetos que ja tinham a tabela profiles criada.

alter table public.profiles
  add column if not exists city_state text,
  add column if not exists document text,
  add column if not exists institutional_note text;

create unique index if not exists profiles_user_id_key
  on public.profiles (user_id);
