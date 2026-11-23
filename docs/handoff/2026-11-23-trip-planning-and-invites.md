---
title: Trip planning, families and invite links
status: done
assignee: X-DSI-agent
base_sha: 8057ca1
adrs: [2026-11-23-multi-trip-data-model.md, 2026-11-23-google-sign-in-and-invite-links.md, 2026-11-23-firestore-with-offline-persistence.md]
plan_pr: 1
impl_pr: 5
review: human
---

## Goal
An organiser can create a trip with its dates, destination, distance and travel legs, set up the
families, and share an invite link; adults join through the link and pick their family. Everything
else in the app hangs off this trip.

## Depends on
[App skeleton](2026-11-23-app-skeleton.md) merged.

## Scope
**In:**
- **Create / edit trip** (`/trips/new`, `/trip/edit`): name, destination, start and end dates,
  expected total km, kid weight (default 0.5), notes. Validation: end ≥ start; km ≥ 0.
- **Travel legs** on the Trip tab: add, edit, reorder, delete legs with mode (car, bus, train,
  flight, other), from, to, date, vehicles, km, notes. Show totals: number of cars, total km (legs'
  km, or the trip's `expectedKm` if no leg has km).
- **Families**: add, edit, deactivate; adults, kids, optional UPI ID, colour from a fixed palette.
  Show trip headcount (adults, kids).
- **Members**: list who has joined, their family, their role; organisers can promote to organiser or
  demote; the owner can't be demoted.
- **Invites**: organisers create an invite (crypto-random code ≥ 128 bits), copy the link, share via
  the Web Share API (falls back to copy), and turn it off. Join page `/join/:code`: sign in if needed,
  show the trip name and dates, then "Which family are you in?" (pick one, or create one). Joining
  sets `activeTripId`.
- **Trip switcher**: "My trips" list in More; shown in the top bar only when the user has more than
  one trip. Creating or joining a trip makes it active.
- **Firestore rules** for `trips`, `legs`, `families`, `members`, `invites` exactly as in the access
  table in `docs/data-model.md`, with emulator tests.
- All edits work offline and show the pending-sync badge until they sync.

**Out:** Expenses, budget, chat. Removing a member from the trip (do it in the console for v1).

## Acceptance criteria
- [ ] Rules: a non-member can't read a trip; a member can't edit trip details, families or roles; an organiser can; joining without a valid active invite fails; nobody can change their own role or list invites — check: `npm run test:rules`
- [ ] E2E: organiser creates a trip with 2 legs and 4 families (2, 4, 3, 3 people), creates an invite; a second user opens the link, signs in, picks a family, and sees the trip — check: `npm run test:e2e -- --grep @trip`
- [ ] E2E @offline: editing a leg while offline shows it immediately with a pending badge, and it syncs when back online — check: `npm run test:e2e -- --grep @offline`
- [ ] Trip, legs and families screens are usable at 390×844 and 1440×900 without horizontal scroll — check: `npm run test:e2e -- --grep @layout`
- [ ] Sharing the invite link from an Android phone opens WhatsApp's share sheet — check: manual

## Constraints
- Joining adds the uid to `memberUids` and creates `members/{uid}` in one batched write.
- Dates are handled as `YYYY-MM-DD` strings in the trip timezone; never convert them through UTC
  `Date` objects (off-by-one risk).

## Implementer may decide
Form library (or none), screen layout and copy, colour palette values.

## Must escalate
Changes to `docs/data-model.md` beyond adding an index; any rule that is looser than the access
table.

## Attached content
None.

## Outcome
**Status:** done (one manual check left for the maintainer)  
**Commits:** 0792f8e..c2f1a53 · **PR:** #5 · **CI run:** https://github.com/X-DSI/trip-budget-tracker/actions/runs/45228820552

### Verified acceptance criteria
- [x] Rules: non-members can't read; members can't edit details, legs, families or roles; organisers can; joining fails without a valid active invite, with a dead one, or with another trip's; nobody changes their own role or lists invites — `firestore rules (emulator)` job, `tests/rules/trips.test.ts`
- [x] E2E @trip: organiser creates a trip with 2 legs and 4 families (2/4/3/3), creates an invite; a second user opens it, signs in, joins, picks a family and sees the trip — `e2e` job, phone and desktop
- [x] E2E @offline: a leg edited offline shows at once with the pending badge, and syncs when back online — `e2e` job, phone and desktop
- [x] No horizontal scroll at 390×844 and 1440×900 — `e2e` job (@layout checks inside the @trip test)

### Unverified (manual) criteria
- [ ] Sharing the invite link from an Android phone opens WhatsApp's share sheet — needs a real phone on the PR preview

### Deviations
- **The join page doesn't show the trip name before joining.** Non-members can't read the trip, and showing it first would need the name copied onto the invite, which changes `docs/data-model.md`. Instead, people tap "Join the trip" and see the trip name and dates straight after, while choosing their family.
- **Any member may add a family**, not only during their own join batch. The rules can't tell "while joining" from "later" without a data-model change. Organisers can still edit or deactivate any family.
- **Bug found and fixed:** live listeners now re-subscribe with backoff after an error. Without this, a trip created offline (or moments ago) had its legs and families denied by the server until the trip itself synced, and those lists never recovered.

### New decisions
- None.

### Questions for the planner
- Should the invite carry the trip name and dates (a data-model change), so the join page can show them before joining?
