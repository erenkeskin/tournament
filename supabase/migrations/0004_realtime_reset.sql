-- Enable realtime for key tables
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.wallets;
alter publication supabase_realtime add table public.bets;
alter publication supabase_realtime add table public.odds;

-- Reset tournament function
create or replace function public.reset_tournament()
returns void as $$
begin
  -- Only admin can reset
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Only admins can reset tournament';
  end if;

  -- Delete in order (respect FK constraints)
  delete from public.transactions_log;
  delete from public.bets;
  delete from public.red_cards;
  delete from public.odds;
  delete from public.matches;
  delete from public.wallets;

  -- Reset profiles
  update public.profiles set selected_team = null, tournament_status = 'PENDING';

  -- Re-create wallets with fresh 1000 VP
  insert into public.wallets (profile_id, balance)
  select id, 1000.00 from public.profiles
  on conflict (profile_id) do update set balance = 1000.00;

  -- Log initial bonuses
  insert into public.transactions_log (wallet_id, amount, type)
  select w.id, 1000.00, 'INITIAL_BONUS'
  from public.wallets w;
end;
$$ language plpgsql security definer;
