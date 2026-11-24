---
title: Dashboard additions — quick add, budget at a glance, recent expenses, important info
status: done
assignee: X-DSI-agent
base_sha: c3bd444
adrs: [2026-11-24-itinerary-replaces-legs.md, 2026-11-24-who-can-change-money.md]
plan_pr: 12
impl_pr: 15
review: human
---

## Goal
Make Home the screen people open on the road: what's next, how the money is going, and the
details they need with no signal.

## Depends on
[Itinerary](2026-11-24-itinerary.md) (for Today's plan) and
[Money tab](2026-11-24-money-tab-and-family-card.md) (for links).

## Scope
**In:**
- **Quick add:** a prominent "Add expense" button on Home that opens the add-expense sheet
  directly (e.g. `/expenses?add=1`).
- **Budget at a glance:** total spent vs planned as one progress bar, and the user's family's
  spent vs planned, linking to `/money/budget`. Hidden when there's no budget.
- **Recent expenses:** the last three non-deleted expenses (title, amount, who paid), linking to
  Expenses.
- **Important info:**
  - The trip's `importantInfo` is shown as a pinned card on Home, before, during and after the
    trip. Line breaks are kept and phone numbers are tappable (`tel:` links).
  - Organisers edit it in a sheet from the card. Rules: organisers only, ≤ 4,000 characters.
  - When it's empty, organisers see "Add hotel addresses, bookings and emergency contacts";
    members see nothing.
- **Order on Home:**
  - during the trip: Today's plan → Quick add → Important info → Today's spend / your balance →
    Budget at a glance → Recent expenses;
  - before the trip: the countdown and checklist stay first.

**Out:** Weather, maps, notifications.

## Acceptance criteria
- [ ] Rules: only organisers change `importantInfo`; longer than 4,000 characters is rejected — check: `npm run test:rules`
- [ ] E2E: an organiser adds important info with a phone number; a member sees it with a tappable `tel:` link; the quick-add button opens the add-expense sheet — check: `npm run test:e2e -- --grep @dashboard`
- [ ] E2E: budget at a glance and recent expenses reflect a new expense — check: `npm run test:e2e -- --grep @dashboard`
- [ ] Home renders offline with all cards from cache — check: `npm run test:e2e -- --grep @offline`

## Constraints
- Phone-number detection must not turn amounts or dates into links. Match Indian mobile and
  landline formats only.

## Implementer may decide
Card styling; the exact phone-number pattern, as long as it's tested.

## Must escalate
Any other new trip field.

## Attached content
None.

## Outcome
**Status:** done  
**Commits:** 7028bb9..c62f397 · **PR:** #15 · **CI run:** https://github.com/X-DSI/trip-budget-tracker/actions/runs/45419539786

### Verified acceptance criteria
- [x] Rules: only organisers change `importantInfo`; more than 4,000 characters (or a non-string) is rejected — `firestore rules (emulator)` job
- [x] E2E: an organiser adds important info with a phone number; a member sees it with a tappable `tel:` link and no Edit; quick add opens the add-expense sheet — `e2e` job, `e2e/home.spec.ts`
- [x] E2E: budget at a glance (₹2,500 of ₹10,000; your family ₹1,250 of ₹5,000) and recent expenses reflect a new expense — same test
- [x] Home renders offline with every card from cache — `e2e` job, `@offline` in `e2e/home.spec.ts`

### Deviations
- **Emergency short codes** (100, 101, 102, 108, 112, 1091) are tappable too, but only right after a word that names them ("Ambulance: 108"), so other 3-digit numbers stay plain text. Unit-tested alongside the mobile and landline detection.
- During the trip, the stats cards (days, families, people, km) move to the bottom of Home; before and after the trip they stay near the top.
- The add-expense sheet now waits for families and members to load, so "paid by" defaults correctly on a direct `/expenses?add=1` load.
- **CI found a real case:** a write made just before a full page reload can be lost. The test now waits for sync before reloading. In the app, normal in-app navigation is unaffected, and `docs/dry-run.md` already tests "close the app right after saving" on real phones.

### New decisions
- None.

### Questions for the planner
- None.
