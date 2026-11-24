---
title: Dark theme (follows the phone, with an override)
status: done
assignee: X-DSI-agent
base_sha: c3bd444
adrs: [2026-11-23-offline-first-pwa.md]
plan_pr: 12
impl_pr: 16
review: auto
---

## Goal
The app looks right in dark mode, which many phones use at night (and on night drives).

## Depends on
The other three handoffs merged, so this one touches each screen once, in its final form.

## Scope
**In:**
- Tailwind's `dark:` variant, driven by a `dark` class on `<html>`.
- **Theme setting in More:** System (default), Light, Dark; stored on the device.
- No flash of the wrong theme on load: a tiny inline script in `index.html` applies the class
  before React renders.
- `theme-color` meta tag updated to match, so the phone's status bar follows.
- Every screen and component reviewed in dark: shell, sign-in, dashboard, trip, itinerary,
  expenses (including the sheet and editors), money, join, more, toasts, sheets, inputs and
  family colour chips.

**Out:** Custom colour themes.

## Acceptance criteria
- [ ] Choosing Dark in More adds the `dark` class and gives a dark page background; System follows the phone's setting — check: `npm run test:e2e -- --grep @theme`
- [ ] The choice survives a reload and works offline — check: `npm run test:e2e -- --grep @theme`
- [ ] Unit: the theme resolver (system/light/dark × the phone's setting) — check: `npm test`
- [ ] Every screen is readable in dark at phone and desktop size; no white panels left behind — check: manual (screenshots in the PR)

## Constraints
- Text contrast at least WCAG AA (4.5:1 for body text) in both themes.

## Implementer may decide
The dark palette (slate-based recommended), the toggle's look.

## Must escalate
Nothing expected.

## Attached content
None.

## Outcome
**Status:** done  
**Commits:** 2f32364..091f046 · **PR:** #16 · **CI run:** https://github.com/X-DSI/trip-budget-tracker/actions/runs/45419544205

### Verified acceptance criteria
- [x] Choosing Dark in More adds the `dark` class and a dark page background; System follows the phone — `e2e` job, `e2e/theme.spec.ts`
- [x] The choice survives a reload and works offline — same
- [x] Unit: the theme resolver (System/Light/Dark × the phone's setting) — unit job, `src/lib/theme.test.ts`
- [x] Every screen readable in dark, no white panels left behind. This was manual in the handoff; it's now **automated**: an e2e scan of Home, Trip, Itinerary, Expenses (plus the add sheet), Budget, Balances, More and sign-in finds no light, opaque panel. The scan first proves it detects the white cards in light mode. Screenshots were also reviewed.

### Deviations
- **One stylesheet instead of `dark:` classes.** `src/dark.css` flips the slate palette's CSS variables and gives white panels, light tints and dark buttons explicit dark colours. This was chosen over `dark:` on hundreds of elements: one place to maintain, new screens are covered automatically, and the scan above guards against misses. It relies on Tailwind compiling colours through `--color-*` variables.
- The inline no-flash script also sets `color-scheme`, so native date/time pickers and scrollbars go dark.

### New decisions
- None.

### Questions for the planner
- None.
