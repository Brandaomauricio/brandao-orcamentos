-- Compatibilidade do perfil profissional usado em /minha-conta.
-- Execute no SQL Editor do Supabase em projetos que ja tinham a tabela profiles criada.

alter table public.profiles
  add column if not exists city_state text,
  add column if not exists document text,
  add column if not exists institutional_note text,
  add column if not exists instagram text,
  add column if not exists address text,
  add column if not exists logo_url text,
  add column if not exists document_number text,
  add column if not exists signature_text text,
  add column if not exists default_payment_terms text,
  add column if not exists default_down_payment_value text,
  add column if not exists default_down_payment_percent text,
  add column if not exists default_quote_validity_days text,
  add column if not exists default_execution_deadline text,
  add column if not exists default_commercial_notes text,
  add column if not exists default_approval_text text,
  add column if not exists default_warranty_text text;

create unique index if not exists profiles_user_id_key
  on public.profiles (user_id);
