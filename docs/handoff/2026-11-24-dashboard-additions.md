---
title: Dashboard additions — quick add, budget at a glance, recent expenses, important info
status: open
assignee: agent:any
base_sha: c3bd444
adrs: [2026-11-24-itinerary-replaces-legs.md, 2026-11-24-who-can-change-money.md]
plan_pr: null
impl_pr: null
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
