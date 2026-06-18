 # PROJECT SPECIFICATION: VIG-FIFA TOURNAMENT & BETTING PLATFORM
 
 ## 1. PROJECT OVERVIEW & GOALS
 This specification defines a robust, real-time web application to manage a corporate FIFA tournament. The system handles league management, dynamic red card suspensions, random team allocation from 48 World Cup nations, real-time standings using specific tie-breakers, top-4 playoff brackets, and an isolated virtual betting economy utilizing "Vigpoint" (VP).
 
 ## 2. TECHNICAL STACK & ARCHITECTURE REQUIREMENTS
  All code must be highly maintainable, type-safe, and fully tested.
 - **Runtime & Package Manager:** Bun (Latest stable)
 - **Linter & Formatter:** Biome (Strict mode enabled, zero errors/warnings allowed)
 - **Testing Framework:** Vitest (Unit & integration tests for core business logic)
 - **Database & Backend:** Supabase (Auth, PostgreSQL, Realtime replication, RLS policies, Row-level transactions)
 - **Frontend Toolkit:** TailwindCSS + Shadcn/ui (Leveraging MCP patterns, pristine accessibility, optimized layout, responsive dashboard)
 
 ## 3. DATABASE SCHEMA (SUPABASE ROBUST ARCHITECTURE)
 
 ### 3.1 Profiles Table
  Links to Supabase auth.users
 - `id`: uuid (Primary Key, References auth.users)
 - `username`: text (Unique)
 - `avatar_url`: text
 - `selected_team`: text (Nullable, locked once assigned from the 48 World Cup teams pool)
 - `is_admin`: boolean (Default: false)
 - `created_at`: timestamp with time zone
 
 ### 3.2 Wallets Table
  Manages the virtual currency "Vigpoint" (VP)
 - `id`: uuid (Primary Key)
 - `profile_id`: uuid (References profiles.id, Unique)
 - `balance`: numeric (Default: 1000.00, constraint: balance >= 0)
 - `updated_at`: timestamp with time zone
 
 ### 3.3 Matches Table
 - `id`: uuid (Primary Key)
 - `stage`: text ('LEAGUE', 'PLAYOFF')
 - `home_player_id`: uuid (References profiles.id)
 - `away_player_id`: uuid (References profiles.id)
 - `home_score`: integer (Nullable)
 - `away_score`: integer (Nullable)
 - `is_played`: boolean (Default: false)
 - `is_forfeit`: boolean (Default: false)
 - `match_date`: timestamp with time zone (Nullable)
 - `round_number`: integer (For league structure tracking)
 - `playoff_metadata`: jsonb (For extra time, penalty shootouts tracking)
 - `created_at`: timestamp with time zone
 
 ### 3.4 RedCards Table
 - `id`: uuid (Primary Key)
 - `match_id`: uuid (References matches.id)
 - `player_id`: uuid (References profiles.id - the user whose team got the red card)
 - `player_name_string`: text (Name of the virtual footballer carded)
 - `served_in_match_id`: uuid (Nullable, references matches.id where suspension is applied)
 
 ### 3.5 Odds Table
 - `id`: uuid (Primary Key)
 - `match_id`: uuid (References matches.id)
 - `odds_home`: numeric (e.g., 1.85)
 - `odds_draw`: numeric (e.g., 3.40)
 - `odds_away`: numeric (e.g., 4.10)
 - `updated_at`: timestamp with time zone
 
 ### 3.6 Bets Table
 - `id`: uuid (Primary Key)
 - `profile_id`: uuid (References profiles.id)
 - `match_id`: uuid (References matches.id)
 - `bet_type`: text ('HOME', 'DRAW', 'AWAY')
 - `amount`: numeric (constraint: amount > 0)
 - `potential_payout`: numeric
 - `status`: text ('PENDING', 'WON', 'LOST', 'VOID')
 - `created_at`: timestamp with time zone
 
 ### 3.7 Transactions Log Table
 - `id`: uuid (Primary Key)
 - `wallet_id`: uuid (References wallets.id)
 - `amount`: numeric
 - `type`: text ('INITIAL_BONUS', 'BET_PLACE', 'BET_WIN', 'ADMIN_ADJUST')
 - `reference_id`: uuid (Nullable)
 - `created_at`: timestamp with time zone
 
 ## 4. CORE BUSINESS LOGIC & SPECS
 
 ### 4.1 Team Allocation ("Kader" Rule)
 - Define a hardcoded list of the 48 nations participating in the expanded World Cup.
 - Implement a live-ticker / wheel component utilizing Shadcn motion primitives for the admin panel.
 - When triggered by Admin, randomly assign an unallocated nation to a user.
 - **Constraint:** Once assigned, the `selected_team` is immutable. No update endpoints allowed for standard profiles. Disqualification flag triggers automatic 3-0 forfeit losses on all upcoming fixtures.
 
 ### 4.2 League Fixtures Engine
 - Given $N$ players, execute a Round-Robin scheduling algorithm (Single round: every player plays everyone else exactly once).
 - Automatically generate `round_number` attributes.
 - **Standings Tie-Breaker Logic (Strict Order):**
   1. Total Points (Win=3, Draw=1, Loss=0)
   2. Goal Difference (General Averaj)
   3. Total Goals Scored
   4. Head-to-Head Record (Kendi aralarındaki maç skoru)
 - **Vitest Requirement:** Write exhaustive unit tests verifying correct standing order handling when points match across multiple permutations.
 
 ### 4.3 Playoff System
 - Top 4 players from the finalized League table automatically qualify.
 - Seeding: Seed 1 vs Seed 4, Seed 2 vs Seed 3.
 - Playoff matches must accept regular time scores, extra time scores, and penalty shootout metrics. No draws allowed.
 
 ### 4.4 Suspensions (Red Card Automation)
 - When a match score is submitted, allow inputting an array of red carded virtual player names under a `player_id`.
 - **Suspension Rule:** The virtual player is automatically suspended for the **very next chronological match** that the `player_id` user participates in.
 - System must prevent matches from being submitted if a suspended player is recorded as scoring or active, or flag a 3-0 forfeit automatically if the user explicitly breaks the lineup constraints.
 
 ### 4.5 Vigpoint Economy & Betting Logic
 - Every user triggers a DB function upon insert that spawns a wallet with exactly `1000.00` VP.
 - Placed bets must execute a database transaction: Deduct balance from `wallets` where `balance >= amount`, insert into `bets`, and log into `transactions_log`.
 - Upon match settlement (Admin submits match score -> `is_played = true`):
   - Find all pending bets for the `match_id`.
   - Update bet statuses to 'WON' or 'LOST'.
   - For 'WON' bets, compute payout and execute balanced transaction adding VP back to user wallets.
   - If a match is flagged as abandoned/error, void the bets and return capital.
 - If balance drops to 0, user status is locked into "Iflas" (Bankrupt) unless overridden by Admin.
 
 ## 5. UI/UX SPECIFICATIONS (SHADCN & FRONTEND DESIGN)
 
 ### 5.1 Style Guide & Components
 - Dark mode default, high-contrast grid layouts mimicking modern sports dashboards (e.g., ESPN / HLTV style).
 - Use Shadcn Alert, Dialog, Table, Badge, and Card components cleanly styled with Tailwind CSS utility classes.
 - Include a permanent humorous banner/toast system warning: *"Eyyam tamamiyle yasaktır!"*
 
 ### 5.2 Required Pages / Views
 - **Dashboard Dashboard:** Real-time Leaderboard table, Next Match countdown, Wallet VP Quick-stats widget.
 - **Live Draw Arena:** Admin-only view to run the live wheel for the 48 World Cup teams with sound/animation capabilities via pure CSS/Framer Motion.
 - **Fixtures & Results List:** Organized round-by-round accordion. Filterable by User. Match cards display Home vs Away, Teams, Scores, Red Cards logged, and Match Status.
 - **Betting Brokerage:** Clean layout displaying active matches with calculated odds buttons. Clicking an odd opens a unified Right-Sheet (Shadcn Sheet component) serving as the Bet Slip. Shows potential payout calculations instantaneously.
 - **Admin Control Console:** Panel for secure score inputs, force-forfeiting a match (3-0 rule execution), entering odds data, and viewing transactional audit trails.
 
 ## 6. QUALITY ASSURANCE CRITERIA & INTEGRATION
 - **Biome Verification:** Run `bun biome check --apply` across all files. Zero errors permitted before frontend runtime validation.
 - **Database Security:** Supabase RLS policies must strictly enforce:
   - `profiles`: Select available to all authenticated users, Update limited to `auth.uid() = id`.
   - `wallets`: Select available to all authenticated users, updates strictly guarded via PostgreSQL server-side functions (RPC) or database triggers to prevent frontend spoofing of VP balances.
   - `bets`: Insert permitted only if authenticated user's wallet balance covers the stake. Select limited to owner and Admins.
 - **Edge Cases to handle via Vitest:**
   1. Match disconnect processing: verifying that partial duration replays properly add up scores without duplicating data.
   2. Wallet concurrency protection: preventing double-spending of Vigpoints if a user rapidly clicks a bet slip button twice.