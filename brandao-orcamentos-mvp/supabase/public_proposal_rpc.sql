-- Execute este arquivo no SQL Editor do Supabase.
-- Ele permite abrir propostas publicas somente por token, sem liberar listagem anonima de quotes.

drop policy if exists "Public can select enabled proposals" on public.quotes;
drop policy if exists "Public can select items from enabled proposals" on public.quote_items;

create or replace function public.get_public_proposal_by_token(p_public_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  proposal jsonb;
begin
  select jsonb_build_object(
    'quote', to_jsonb(q),
    'items', coalesce(
      (
        select jsonb_agg(to_jsonb(qi) order by qi.sort_order asc nulls last, qi.created_at asc)
        from public.quote_items qi
        where qi.quote_id = q.id
      ),
      '[]'::jsonb
    ),
    'profile', (
      select to_jsonb(p)
      from public.profiles p
      where p.user_id = q.user_id
      limit 1
    )
  )
  into proposal
  from public.quotes q
  where q.public_token = p_public_token
    and q.public_link_enabled = true
    and q.public_token is not null
  limit 1;

  return proposal;
end;
$$;

revoke all on function public.get_public_proposal_by_token(text) from public;
grant execute on function public.get_public_proposal_by_token(text) to anon, authenticated;
