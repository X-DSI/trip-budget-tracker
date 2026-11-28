---
title: "New since you last looked" on Expenses
status: done
assignee: X-DSI-agent
base_sha: 2056ec5
adrs: [2026-11-23-offline-first-pwa.md]
plan_pr: 23
impl_pr: 24
review: auto
---

## Goal
People notice what others added or changed without a server or push notifications: the Expenses
tab shows how many expenses are new since they last looked, and those rows stand out.

## Depends on
Nothing. No data-model or rules change. Real push notifications need Cloud Functions (Blaze plan)
and are left for after the trip.

## Scope
**In:**
1. Each phone remembers, per trip, the newest expense time it has shown (server timestamps, so
   phone clocks don't matter).
2. The Expenses tab (bottom tabs and sidebar) shows a count of expenses that **someone else**
   added or edited after that. Your own changes never count.
3. On Expenses, those rows show **New** or **Edited** until you leave the page. Opening the page
   (while it's on screen) marks everything seen, so the count clears.
4. The first time a phone sees a trip, nothing is "new" (no wall of badges for existing data).

**Out:** Push notifications; syncing "seen" between your devices; itinerary or budget changes.

## Acceptance criteria
- [ ] Counting rules (others only, new vs edited, deleted ignored, first visit) — check: `npm test`
- [ ] Another adult's new expense shows a count on the Expenses tab, a **New** row, and the count clears after viewing — check: `npm run test:e2e -- --grep @unseen`
- [ ] Works on phone (bottom tabs) and desktop (sidebar) — check: `npm run test:e2e -- --grep @unseen`
- [ ] Readable in light and dark — check: manual

## Constraints
- "Seen" lives in localStorage; when it can't be read, nothing shows as new (never an error).
- No extra Firestore reads beyond the existing expenses listener.

## Implementer may decide
Badge style, wording, where the hook lives.

## Must escalate
Anything that needs a rules or data-model change.

## Attached content
None.

## Outcome
**Status:** done  
**Commits:** c686169..8ac7abc · **PR:** #24 · **CI run:** see PR #24 checks

### Verified acceptance criteria
- [x] Counting rules (others only, new vs edited, deleted ignored, first visit) — unit job, `src/features/expenses/unseen.test.ts`
- [x] Another adult's new expense shows a count on the Expenses tab, a **New** row, and the count clears after viewing — `e2e` job, `e2e/unseen.spec.ts` (`@unseen`)
- [x] Works on phone (bottom tabs) and desktop (sidebar) — `e2e/unseen.spec.ts` runs on both projects; `AppShell.test.tsx` checks both badges

### Unverified (manual) criteria
- [ ] Readable in light and dark.

### Deviations
- On a phone's first visit the starting point waits for server data, not cached data, so an empty cache can't make every expense look new.
- The badge shows "9+" above nine.

### New decisions
- None.

### Questions for the planner
- None.
