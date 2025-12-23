# Vortex Simulation Backend — Implementation Plan (Step-by-step, aligned to current UI)

This plan turns `docs/vortex-simulation-processes.md` + `docs/vortex-simulation-tech-architecture.md` into an executable roadmap.

## Guiding principles
- Ship a **thin vertical slice** first: auth → gate → read models → one write action → feed events.
- Keep domain logic **pure and shared** (state machine + events). The API is a thin adapter.
- Prefer **deterministic**, testable transitions; avoid “magic UI-only numbers”.
- Enforce gating on **every write**: “browse open, write gated”.
- Minimize UI churn: start by making API responses **match the shapes** currently provided by `src/data/mock/*`, then gradually improve.

## Phase 0 — Lock v1 decisions (1–2 days)
1) Decide database now: **Postgres (recommended)** or **D1**.
2) Decide gating source priority: **RPC first** with **Subscan fallback**.
3) Decide what “active Human Node” means for v1:
   - “In current validator set”, or
   - “Bioauth epochs 42/42 last week”, or
   - a composite rule.
4) Decide era length for simulation rollups (e.g. 1 week) and where it’s configured.

Deliverable: a short “v1 constants” section committed to docs or config.

## Phase 1 — Define contracts that mirror the UI (1–2 days)
The UI is currently driven by `src/data/mock/*` (e.g. proposals list cards, proposal pages, chamber detail). Start by freezing the “API contract” so backend and frontend can meet in the middle.

1) Define response DTOs that match the current UI needs:
   - Chambers directory card: id/name/multiplier + stats + pipeline.
   - Chamber detail: stage-filtered proposals + governors + threads/chat.
   - Proposals list: the exact data currently rendered in collapsed/expanded cards.
   - Proposal pages: PP / Chamber vote / Formation page models.
   - Courts list + courtroom page model.
   - Human nodes list + profile model.
   - Feed item model (the card layout currently used).
2) Decide how IDs work across the system (proposalId, chamberId, humanId) and make them consistent.

Deliverable: a short “API contract v1” section (types + endpoint list) that the backend must satisfy.

## Phase 2 — API + DB skeleton (1–3 days)
1) Create API worker entry (Cloudflare Worker / Pages Function).
2) Add DB migrations + Drizzle schema (minimal tables first).
3) Add `GET /api/health`.
4) Add a `clock_state` row and an admin-only `POST /api/clock/advance-era` stub (no rollup logic yet).
5) Add a small “seed” script/job that imports today’s `src/data/mock/*` into DB tables (so the first backend responses can match the UI immediately).

Deliverable: deployed API that responds and can connect to the DB.

## Phase 3 — Auth + eligibility gate (3–7 days)
1) `POST /api/auth/nonce`:
   - store nonce with expiry
   - rate limit per IP/address
2) `POST /api/auth/verify`:
   - verify signature
   - create/find `users` row
   - create session cookie/JWT
3) `GET /api/gate/status`:
   - read session address
   - query eligibility via RPC/Subscan
   - cache result with TTL (`eligibility_cache`)
4) Frontend wiring:
   - add “Connect wallet / Verify” UI (even a simple modal is enough)
   - disable all write buttons unless eligible (and show a short reason on hover)
   - allow non-eligible users to browse everything

Deliverable: users can log in; the UI knows if they’re eligible; buttons are blocked for non-eligible users.

## Phase 4 — Read models first (3–8 days)
Goal: replace `src/data/mock/*` progressively with API reads, with minimal UI refactor.

1) `GET /api/chambers`:
   - return chamber list + multipliers + computed stats
   - match `src/data/mock/chambers.ts` shape first
2) `GET /api/proposals?stage=...`:
   - return proposal list cards for the Proposals page
   - match `src/data/mock/proposals.ts` shape first
3) `GET /api/proposals/:id`:
   - return proposal page model for ProposalPP/Chamber/Formation
   - match `src/data/mock/proposalPages.ts` getters first
4) `GET /api/feed?cursor=...`:
   - return feed items derived from `events`
   - match `src/data/mock/feed.tsx` shape first

Frontend:
- Create a tiny `src/lib/api.ts` fetch wrapper (base URL, typed helpers, error handling).
- Add `src/lib/useApiQuery.ts` (simple cache) or adopt TanStack Query later.
- Swap one page at a time from mock imports to API reads; keep a dev fallback flag if needed.

Deliverable: app renders from backend reads (at least Chambers + Proposals + Feed).

## Phase 5 — Event log (feed) as the backbone (2–6 days)
1) Create `events` table (append-only).
2) Define event types (union) and payload schemas (zod).
3) Implement a simple “projector”:
   - basic derived feed cards from events
   - cursors for pagination
4) Backfill initial events from seeded mock data (so the feed isn’t empty on day 1).

Deliverable: feed is powered by real events; pages can also show histories from the event stream.

## Phase 6 — First write slice: Proposal pool voting (4–10 days)
1) Implement `POST /api/command` with:
   - auth required
   - gating required (`isActiveHumanNode`)
   - idempotency key support
2) Implement `pool.vote` command:
   - write pool vote with unique constraint (proposalId + userId)
   - emit `pool.vote_cast`
   - update/compute pool metrics
   - if gates met, emit `proposal.moved_to_vote` + transition record
3) Frontend:
   - ProposalPP page upvote/downvote calls API
   - optimistic UI optional (but must reconcile)

Deliverable: users can perform one real action (pool vote) and see it in metrics + feed.

## Phase 7 — Chamber vote (decision) + CM awarding (5–14 days)
1) Add `chamber.vote` command:
   - yes/no/abstain
   - quorum + passing rule evaluation
   - emit events
2) On pass:
   - transition to Formation if eligible
   - award CM (LCM per chamber) and recompute derived ACM
3) Frontend:
   - ProposalChamber becomes real

Deliverable: end-to-end proposal lifecycle from pool → vote (pass/fail) is operational.

## Phase 8 — Formation v1 (execution) (5–14 days)
1) Formation project row is created when proposal enters Formation.
2) `formation.join` fills team slots.
3) `formation.milestone.submit` records deliverables.
4) `formation.milestone.requestUnlock` emits an event; acceptance can be mocked initially.
5) Formation metrics and pages read from DB/events.

Deliverable: Formation pages become real and emit feed events.

## Phase 9 — Courts v1 (disputes) (5–14 days)
1) `court.case.report` creates or increments cases.
2) Case state machine: Jury → Session live → Ended (driven by time or thresholds).
3) `court.case.verdict` records guilty/not-guilty.
4) Outcome hooks (v1):
   - hold/release a milestone unlock request
   - flag identity as “restricted” (simulation only)

Deliverable: courts flow works and affects off-chain simulation outcomes.

## Phase 10 — Era rollups + tier statuses (ongoing)
1) Implement cron rollup:
   - freeze era action counts
   - compute `isActiveGovernorNextEra`
   - compute tier decay + statuses (Ahead/Stable/Falling behind/At risk/Losing status)
   - update quorum baselines
2) Store `era_snapshots` and emit `era.rolled` events.

Deliverable: system “moves” with time and feels like governance.

## Phase 11 — Hardening + moderation (ongoing)
- Rate limiting (per IP/address) and anti-spam (per-era quotas).
- Auditability: make all state transitions and changes event-backed.
- Admin tools: manual “advance era”, seed data, freeze/unfreeze.
- Observability: logs + basic metrics for rollups and gating failures.
- Moderation controls (off-chain):
  - temporary action lock for a user
  - court-driven restrictions flags (simulation)

## Suggested implementation order (lowest risk / highest value)
1) Auth + gate
2) Read models for Chambers + Proposals + Feed
3) Event log
4) Pool voting
5) Chamber voting + CM awarding
6) Formation
7) Courts
8) Era rollups + tier statuses

## Milestone definition for “proto-vortex launch”
Minimum viable proto-vortex for community:
- Login with wallet signature
- Eligibility gate from mainnet
- Read-only browsing for all users
- Eligible users can:
  - upvote/downvote in pool
  - vote yes/no/abstain in chamber vote
- Feed shows real events
- Era rollup runs at least manually (admin endpoint)

## Notes specific to the current UI
- The UI already has the key surfaces for v1:
  - `ProposalCreation` wizard (draft), ProposalPP (pool), ProposalChamber (vote), ProposalFormation (formation), Courts/Courtroom (courts).
- Start by returning API payloads that match the existing mock getters (`src/data/mock/proposalPages.ts`, etc.) to avoid rewriting UI components.
- Migrate page-by-page: keep visuals stable while the data source shifts from `src/data/mock/*` to `/api/*`.
