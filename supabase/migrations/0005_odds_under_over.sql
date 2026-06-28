-- Add under/over odds columns
alter table public.odds
  add column odds_under numeric,
  add column odds_over numeric;

-- Update constraint: allow null for existing rows, but new inserts must have positive values
alter table public.odds
  add constraint positive_over_under check (
    odds_under is null or odds_under > 0
    and odds_over is null or odds_over > 0
  );
