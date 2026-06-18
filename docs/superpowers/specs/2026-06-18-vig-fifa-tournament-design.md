# Design Spec: VIG-FIFA Tournament & Betting Platform

**Date:** 2026-06-18  
**Status:** Approved  
**Approach:** Vite + React SPA + Hono API (Bun-native, ayrık backend)

---

## 1. Project Structure

Bun workspace monorepo, iki paket:

```
turnuva/
├── packages/
│   ├── api/                    # Hono API sunucusu (Bun)
│   │   ├── src/
│   │   │   ├── index.ts        # Entry point
│   │   │   ├── routes/         # auth, matches, bets, standings, admin
│   │   │   ├── services/       # Pure business logic (Vitest-tested)
│   │   │   │   ├── league-engine.ts
│   │   │   │   ├── betting-engine.ts
│   │   │   │   ├── suspension-engine.ts
│   │   │   │   ├── team-allocation.ts
│   │   │   │   └── playoff-engine.ts
│   │   │   ├── middleware/     # auth.ts, admin.ts
│   │   │   ├── db/             # client.ts, schema.ts (TypeScript types)
│   │   │   └── lib/            # errors.ts
│   │   └── test/
│   │
│   └── web/                    # Vite + React SPA
│       ├── src/
│       │   ├── App.tsx, main.tsx
│       │   ├── components/
│       │   │   ├── ui/         # Shadcn/ui
│       │   │   ├── layout/     # Shell, sidebar, header
│       │   │   └── features/   # Page-specific components
│       │   ├── pages/          # Dashboard, LiveDraw, Fixtures, Betting, Admin
│       │   ├── hooks/
│       │   ├── lib/            # api.ts, supabase.ts
│       │   └── stores/         # Zustand stores
│       └── package.json
│
├── supabase/
│   └── migrations/
│       ├── 0000_schema.sql
│       └── 0001_rls_policies.sql
├── docs/
│   └── PRD.md
├── package.json                # Root workspace
├── biome.json
├── tsconfig.json
└── bun.lockb
```

---

## 2. Database Schema

Seven tables with full referential integrity. Schema follows PRD Section 3 exactly.

**Migration 0000_schema.sql:**
- `profiles` — auth.users trigger sync, username (unique), selected_team (immutable after assign), is_admin
- `wallets` — 1:1 with profiles, balance 1000.00 default, balance >= 0 constraint, auto-created on profile insert
- `matches` — stage (LEAGUE/PLAYOFF), home/away player refs, scores nullable, is_played, is_forfeit, round_number, playoff_metadata jsonb
- `red_cards` — match ref, player ref, virtual player name, served_in_match ref
- `odds` — match ref, home/draw/away numeric odds
- `bets` — profile ref, match ref, bet_type (HOME/DRAW/AWAY), amount, potential_payout, status (PENDING/WON/LOST/VOID)
- `transactions_log` — wallet ref, amount, type (INITIAL_BONUS/BET_PLACE/BET_WIN/ADMIN_ADJUST), reference_id, append-only

**Migration 0001_rls_policies.sql:**
- profiles: SELECT all auth, UPDATE only auth.uid() = id
- wallets: SELECT all auth, UPDATE via RPC functions only (no direct frontend write)
- bets: INSERT only if wallet balance covers stake (policy check), SELECT owner + admin
- matches: SELECT all auth, UPDATE admin only
- transactions_log: SELECT owner + admin

---

## 3. API Routes & Business Logic

### Hono API Routes

| Route | Method | Access | Purpose |
|-------|--------|--------|---------|
| `/api/standings` | GET | All | Live standings with tie-breaker ordering |
| `/api/matches` | GET | All | All matches, filterable by round |
| `/api/matches/:id/score` | POST | Admin | Submit score + red cards |
| `/api/matches/:id/forfeit` | POST | Admin | Force 3-0 forfeit |
| `/api/bets` | GET | User | Own bet history |
| `/api/bets` | POST | User | Place bet (wallet check) |
| `/api/teams/allocate` | POST | Admin | Random team assignment |
| `/api/teams/wheel` | GET | Admin | Remaining unassigned nations |
| `/api/admin/audit` | GET | Admin | Transaction log |
| `/api/admin/odds` | POST | Admin | Enter match odds |
| `/api/wallet` | GET | User | Own VP balance |

### 5 Core Services (Pure TypeScript, Vitest-tested)

**league-engine.ts:**
- `generateFixtures(playerIds) → Match[]` — Single round-robin, round_number assigned
- `calculateStandings(matches) → StandingRow[]` — Tie-breaker: Points → Goal Diff → Goals Scored → H2H

**team-allocation.ts:**
- 48 World Cup nations hardcoded array
- `allocateTeam(availableNations, assigned) → {playerId, nation}` — Random, no repeats, immutable

**suspension-engine.ts:**
- `getSuspendedPlayers(redCards, nextMatchId) → Set<string>`
- `validateLineup(matchId, playerId, redCards) → boolean` — Suspended player cannot play

**betting-engine.ts:**
- `placeBet(wallet, matchId, betType, amount, odds) → BetResult` — Deduct + insert + log
- `settleMatch(matchId, result) → SettlementResult` — Process all PENDING bets, credit winners

**playoff-engine.ts:**
- `generatePlayoffBracket(top4) → PlayoffMatch[]` — Seed 1v4, 2v3
- `validatePlayoffResult(match) → ValidationResult` — No draws, extra time + penalties required

### Data Flow

```
React SPA → fetch() → Hono Route → Service function → Supabase SDK → PostgreSQL
                                              ↑
                                         Vitest tests
                                    (no Supabase dependency)
```

Services are pure functions, no Supabase dependency. Route handlers manage DB integration.

---

## 4. Frontend Pages & Components

Dark mode default, ESPN/HLTV sports dashboard aesthetic.

### Pages

| Route | Page | Key Components |
|-------|------|---------------|
| `/` | Dashboard | LeaderboardTable, NextMatchCard, WalletWidget |
| `/fixtures` | Fixtures & Results | RoundAccordion, MatchCard[], PlayerFilter |
| `/betting` | Betting Brokerage | MatchOddsGrid, BetSlipSheet |
| `/draw` | Live Draw Arena (Admin) | WheelAnimation, PlayerQueue, AllocationHistory |
| `/admin` | Admin Console | ScoreInput, OddsInput, ForfeitButton, AuditLog |

### Key Shadcn/ui Components Used

Table, Accordion, Sheet, Card, Badge, Dialog, Alert, Select, Toast (Sonner)

### State Management

Zustand stores: `useAuthStore`, `useWalletStore`, `useMatchesStore`, `useBetSlipStore`

### Realtime Strategy

Supabase Realtime subscriptions on `matches` (score updates → leaderboard) and `wallets` (balance changes → wallet widget).

---

## 5. Testing Strategy

### Unit Tests (Vitest) — 5 Core Services

- **league-engine.test.ts**: Tie-breaker scenarios (equal points → goal diff → goals scored → H2H), forfeit effects
- **betting-engine.test.ts**: Normal bet flow, double-click concurrency protection, match settlement, void match capital return, balance below zero guard
- **suspension-engine.test.ts**: Red card suspension for next match, suspended player lineup violation, multiple cards
- **team-allocation.test.ts**: 48 teams no-repeat assignment, exhaustion when all assigned, immutability check
- **playoff-engine.test.ts**: Correct 1v4/2v3 seeding, draw rejection validation

### Integration Tests

- Hono route handlers return correct HTTP responses
- Auth middleware rejects unauthenticated requests
- Admin middleware checks role

### Run

```bash
bun test
bun test --coverage
```

---

## 6. Security Architecture

Dual-layer security:

```
Frontend → Hono API (JWT auth middleware)
                ↓
         Service layer (business rules, validation)
                ↓
         Supabase PostgreSQL (RLS second defense line)
```

- **API layer**: Supabase JWT verified per request, admin routes check `is_admin`
- **RLS layer**: PostgreSQL-level enforcement — frontend Supabase SDK used only for auth + realtime, never direct data writes
- **Wallet protection**: `wallets` UPDATE only via RPC functions, never from frontend
- **Betting safety**: API-level transaction: balance check → bet insert → log insert → balance update, all atomic

---

## 7. Implementation Order

1. **Foundation**: Bun workspace, Biome, TypeScript configs, Supabase local setup, migrations
2. **Core Services** (with Vitest tests): league-engine → team-allocation → suspension-engine → betting-engine → playoff-engine
3. **Hono API**: Middleware → route handlers → service integration
4. **Frontend Shell**: Vite + React setup, Shadcn/ui init, layout, routing, auth
5. **Frontend Pages** (in order): Dashboard → Fixtures → Betting → Live Draw → Admin Console
6. **Integration & Polish**: Realtime subscriptions, toast notifications, Biome check zero errors, final test run

---

## 8. Constraints & Decisions

| Decision | Rationale |
|----------|-----------|
| Bun workspace monorepo | PRD requires Bun runtime; native workspace support |
| Hono over Express/Fastify | Bun-native, fastest, lightweight, full TypeScript |
| Services decoupled from Supabase | Enables fast Vitest unit tests without DB dependency |
| Zustand over Redux/Context | Lightweight, minimal boilerplate, sufficient for SPA |
| Static fixture generation | All players known at tournament start, no mid-tournament joins |
| RLS + API dual security | Defense in depth — even if API is bypassed, RLS protects |
| Local Supabase first | User will add production project later; migration scripts portable |
