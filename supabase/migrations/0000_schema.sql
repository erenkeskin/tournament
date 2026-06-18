-- Profiles table (synced with auth.users)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  avatar_url text,
  selected_team text,
  is_admin boolean default false,
  created_at timestamp with time zone default now(),
  constraint selected_team_check check (selected_team is null or char_length(selected_team) > 0)
);

-- Auto-create profile on signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'username', new.email));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Wallets table
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique not null references public.profiles(id) on delete cascade,
  balance numeric default 1000.00 not null,
  updated_at timestamp with time zone default now(),
  constraint balance_non_negative check (balance >= 0)
);

-- Auto-create wallet on profile creation
create function public.handle_new_profile()
returns trigger as $$
begin
  insert into public.wallets (profile_id, balance)
  values (new.id, 1000.00);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_profile();

-- Matches table
create type public.match_stage as enum ('LEAGUE', 'PLAYOFF');

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  stage public.match_stage not null default 'LEAGUE',
  home_player_id uuid not null references public.profiles(id),
  away_player_id uuid not null references public.profiles(id),
  home_score integer,
  away_score integer,
  is_played boolean default false,
  is_forfeit boolean default false,
  match_date timestamp with time zone,
  round_number integer,
  playoff_metadata jsonb,
  created_at timestamp with time zone default now(),
  constraint different_players check (home_player_id != away_player_id),
  constraint score_required_when_played check (not is_played or (home_score is not null and away_score is not null))
);

-- Red Cards table
create table public.red_cards (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.profiles(id),
  player_name_string text not null,
  served_in_match_id uuid references public.matches(id)
);

-- Odds table
create table public.odds (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade unique,
  odds_home numeric not null,
  odds_draw numeric not null,
  odds_away numeric not null,
  updated_at timestamp with time zone default now(),
  constraint positive_odds check (odds_home > 0 and odds_draw > 0 and odds_away > 0)
);

-- Bets table
create type public.bet_type as enum ('HOME', 'DRAW', 'AWAY');
create type public.bet_status as enum ('PENDING', 'WON', 'LOST', 'VOID');

create table public.bets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id),
  match_id uuid not null references public.matches(id),
  bet_type public.bet_type not null,
  amount numeric not null,
  potential_payout numeric not null,
  status public.bet_status default 'PENDING',
  created_at timestamp with time zone default now(),
  constraint positive_amount check (amount > 0)
);

-- Transactions Log table
create type public.transaction_type as enum ('INITIAL_BONUS', 'BET_PLACE', 'BET_WIN', 'ADMIN_ADJUST');

create table public.transactions_log (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id),
  amount numeric not null,
  type public.transaction_type not null,
  reference_id uuid,
  created_at timestamp with time zone default now()
);
