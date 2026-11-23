---
title: Dashboard — countdown before the trip, welcome during it, summary after
status: open
assignee: agent:any
base_sha: 8057ca1
adrs: [2026-11-23-multi-trip-data-model.md, 2026-11-23-offline-first-pwa.md]
plan_pr: null
impl_pr: null
review: auto
---

## Goal
The Home tab is the first screen. Before the trip it builds excitement with a countdown; during the
trip it welcomes people to the day; afterwards it points them to settling up.

## Depends on
[App skeleton](2026-11-23-app-skeleton.md) and [trip planning](2026-11-23-trip-planning-and-invites.md)
merged.

## Scope
**In:**
- A pure function `tripPhase(trip, now) → { phase: 'none' | 'before' | 'during' | 'after', dayNumber?, totalDays, daysToGo?, msToStart? }`
  using the trip's timezone; the trip starts at 00:00 on `startDate` and ends at 23:59:59 on
  `endDate`.
- **No active trip:** a friendly empty state with "Plan a trip" and "Join with a link".
- **Before:** "Hi {first name}! {trip name} starts in" with a live countdown (days, hours, minutes;
  seconds only on the last day), dates, destination, headcount, families, total km and vehicles, and
  a short "get ready" checklist: everyone joined (members vs adults), app installed, budget set
  (link, disabled until the budget handoff).
- **During:** "Day {n} of {total} — enjoy {destination}, {first name}!" with a rotating friendly line
  per day (local list, no network), today's legs, and placeholders for "today's spend" and "your
  family's balance" that later handoffs fill in.
- **After:** "Welcome back! Hope {trip name} was wonderful" with a prompt to the Balances tab.
- Works offline from cached data; the countdown runs from the device clock.

**Out:** Spending figures (expense handoff), weather, maps, photos.

## Acceptance criteria
- [ ] `tripPhase` is correct at the boundaries: 23:59 IST the day before start, 00:00 on start day, last day 23:59, the next day 00:00, and for a one-day trip — check: `npx vitest run src/features/dashboard`
- [ ] E2E with a mocked clock: before shows the countdown; during shows "Day 2 of 4"; after shows the welcome-back card — check: `npm run test:e2e -- --grep @dashboard`
- [ ] Dashboard renders offline after one online visit — check: `npm run test:e2e -- --grep @offline`
- [ ] Looks good and fits without scrolling sideways at 390×844 and 1440×900 — check: manual

## Constraints
- No network calls of its own; read only the active trip's cached documents.
- The countdown must not re-render the whole page every second; isolate the ticking component.

## Implementer may decide
Copy and tone of the friendly lines, layout, animation (respect `prefers-reduced-motion`).

## Must escalate
Anything needing a new field in `docs/data-model.md`.

## Attached content
None.
