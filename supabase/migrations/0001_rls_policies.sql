-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.matches enable row level security;
alter table public.red_cards enable row level security;
alter table public.odds enable row level security;
alter table public.bets enable row level security;
alter table public.transactions_log enable row level security;

-- Profiles: SELECT all authenticated, UPDATE own only
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated using (auth.uid() = id)
  with check (auth.uid() = id);

-- Wallets: SELECT all authenticated, UPDATE via RPC only (no direct update policy)
create policy "Wallets are viewable by authenticated users"
  on public.wallets for select
  to authenticated using (true);

-- Matches: SELECT all authenticated, INSERT/UPDATE admin only
create policy "Matches are viewable by authenticated users"
  on public.matches for select
  to authenticated using (true);

create policy "Only admins can insert matches"
  on public.matches for insert
  to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Only admins can update matches"
  on public.matches for update
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Red Cards: SELECT all authenticated, INSERT admin only
create policy "Red cards are viewable by authenticated users"
  on public.red_cards for select
  to authenticated using (true);

create policy "Only admins can insert red cards"
  on public.red_cards for insert
  to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Odds: SELECT all authenticated, INSERT/UPDATE admin only
create policy "Odds are viewable by authenticated users"
  on public.odds for select
  to authenticated using (true);

create policy "Only admins can manage odds"
  on public.odds for insert
  to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Only admins can update odds"
  on public.odds for update
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Bets: SELECT own + admin, INSERT own only
create policy "Users can view own bets"
  on public.bets for select
  to authenticated
  using (profile_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Users can place own bets"
  on public.bets for insert
  to authenticated
  with check (profile_id = auth.uid());

-- Transactions Log: SELECT own wallet + admin
create policy "Users can view own transactions"
  on public.transactions_log for select
  to authenticated
  using (
    exists (select 1 from public.wallets where id = transactions_log.wallet_id and profile_id = auth.uid())
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- RPC function: Secure wallet update (deduct balance)
create function public.deduct_balance(wallet_id uuid, amount numeric, bet_id uuid)
returns void as $$
begin
  update public.wallets
  set balance = balance - amount, updated_at = now()
  where id = wallet_id and balance >= amount;

  if not found then
    raise exception 'Insufficient balance';
  end if;

  insert into public.transactions_log (wallet_id, amount, type, reference_id)
  values (wallet_id, -amount, 'BET_PLACE', bet_id);
end;
$$ language plpgsql security definer;

-- RPC function: Credit winnings
create function public.credit_winnings(wallet_id uuid, amount numeric, bet_id uuid)
returns void as $$
begin
  update public.wallets
  set balance = balance + amount, updated_at = now()
  where id = wallet_id;

  insert into public.transactions_log (wallet_id, amount, type, reference_id)
  values (wallet_id, amount, 'BET_WIN', bet_id);
end;
$$ language plpgsql security definer;

-- RPC function: Admin adjustment
create function public.admin_adjust_balance(wallet_id uuid, amount numeric, reason text default null)
returns void as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Only admins can adjust balances';
  end if;

  update public.wallets
  set balance = balance + amount, updated_at = now()
  where id = wallet_id;

  insert into public.transactions_log (wallet_id, amount, type)
  values (wallet_id, amount, 'ADMIN_ADJUST');
end;
$$ language plpgsql security definer;
