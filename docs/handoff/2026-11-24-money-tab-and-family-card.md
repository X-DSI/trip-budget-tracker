---
title: Money tab (Budget | Balances) and a "Your family" card for members
status: done
assignee: X-DSI-agent
base_sha: c3bd444
adrs: [2026-11-24-who-can-change-money.md]
plan_pr: 12
impl_pr: 13
review: auto
---

## Goal
Give the budget its own place, readable by everyone and editable only by organisers, without
adding a sixth tab. Fill the empty space members see on the Trip page with something useful.

## Scope
**In:**
- **Money tab.** It replaces the Balances tab, in the same position, with a Budget | Balances
  switch at the top. Routes are `/money/budget` and `/money/balances`; `/balances` redirects to
  `/money/balances`.
  - Budget: the existing budget section (plan, each family's share, budget vs actual) moves here
    from the Trip tab.
  - Organisers see the edit controls; members see the same page read-only, with a line saying
    only organisers can change it.
- Dashboard links that pointed to `/balances` point to the new routes.
- **"Your family" card** on the Trip page, in the slot organisers use for invites. Members see:
  - their family's name, size and who has joined in it;
  - its UPI ID, or "No UPI ID yet — ask an organiser to add it so others can pay you back";
  - a "Change family" picker;
  - "Need to invite someone? Ask {owner name}."
  - Organisers see the card too, above the invite card.

**Out:** Changing who can edit the budget.

## Acceptance criteria
- [ ] Phone shows 5 tabs including Money (no Balances tab); desktop sidebar the same — check: `npm run test:e2e -- --grep @layout`
- [ ] A member sees the budget read-only on `/money/budget`; an organiser can add a line there — check: `npm run test:e2e -- --grep @budget`
- [ ] `/balances` lands on `/money/balances` — check: `npm run test:e2e -- --grep @balances`
- [ ] A member's Trip page shows the "Your family" card and no invite card — check: `npm run test:e2e -- --grep @trip`

## Constraints
- Don't change the budget or balance maths; this is a move plus new UI.

## Implementer may decide
The look of the Budget | Balances switch; the card's layout.

## Must escalate
Any rules change.

## Attached content
None.

## Outcome
**Status:** done  
**Commits:** 925f7ca..cb468e0 · **PR:** #13 · **CI run:** https://github.com/X-DSI/trip-budget-tracker/actions/runs/45414973911

### Verified acceptance criteria
- [x] Phone shows 5 tabs including Money and no Balances tab; the desktop sidebar is the same — `e2e` job, `@layout` in `e2e/shell.spec.ts`
- [x] A member sees the budget read-only on `/money/budget`; an organiser adds lines there — `e2e` job, `@budget`
- [x] `/balances` lands on `/money/balances` — `e2e` job, `@balances`
- [x] A member's Trip page shows "Your family" and no invite card — `e2e` job, `@trip`

### Deviations
- The **Change family** picker moved from the People list into the "Your family" card, so there's only one.
- `/money` opens Balances by default (more useful on the road); `/budget` redirects to `/money/budget`.
- `Card` now passes extra props through, which the new `data-testid`s needed.

### New decisions
- None.

### Questions for the planner
- None.
