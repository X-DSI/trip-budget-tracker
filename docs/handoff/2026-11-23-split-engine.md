---
title: Split and settlement engine — pure TypeScript, fully unit-tested
status: done
assignee: X-DSI-agent
base_sha: 8057ca1
adrs: [2026-11-23-money-as-integer-paise.md, 2026-11-23-expenses-are-the-source-of-truth.md, 2026-11-23-split-modes.md]
plan_pr: 1
impl_pr: 3
review: auto
---

## Goal
The maths that decides who owes what, as a pure module with no UI or Firebase dependency, so it can
be built in parallel with the app skeleton and trusted on the trip.

## Scope
**In:** `src/domain/money.ts`, `src/domain/split.ts`, `src/domain/settle.ts` (or similar) with tests:
- `toPaise(input: string): number` (accepts `"1,250.5"`, `"₹1250"`, rejects more than 2 decimals or
  negatives) and `formatINR(paise)` using `en-IN` grouping.
- `allocate(totalPaise, weights[]) → paise[]`: largest-remainder rounding, ties broken by the given
  order; sum always equals total.
- `splitExpense(expense, families, kidWeight) → Record<familyId, paise>` for every mode in the
  split-modes ADR: `equal_family`, `per_head`, `itemized` (with `shared` items split per head and
  `extrasPaise` spread in proportion to each family's item total, shared share included), `custom`
  (validates the sum), `personal`.
- `balances(expenses, settlements, families, kidWeight) → Record<familyId, { paid, share, net }>`
  ignoring `deleted` expenses.
- `suggestSettlements(balances) → { from, to, amountPaise }[]`: greedy largest-debtor to
  largest-creditor.
- `upiLink({ upiId, payeeName, amountPaise, note })` building
  `upi://pay?pa=…&pn=…&am=1250.50&cu=INR&tn=…` with proper encoding.
- `familyBudgetShares(budgetLines, families, kidWeight)` — the same split logic applied to planned
  amounts.

If `src/` does not exist yet (skeleton not merged), add a minimal `package.json` with TypeScript and
Vitest only; the skeleton handoff will merge into it.

**Out:** UI, Firestore reads/writes.

## Acceptance criteria
- [ ] ₹4,000 per head over families of 2/4/3/3 adults gives families A/B/C/D 66667/133333/100000/100000 paise, summing to 400000 — check: `npx vitest run src/domain`
- [ ] Property test: for random totals and weights, `allocate` always sums to the total and no share differs from its exact value by ≥ 1 paise — check: `npx vitest run src/domain`
- [ ] Itemized: a family's own dishes plus its per-head share of shared dishes plus proportional extras equals its share, and all shares sum to the bill — check: `npx vitest run src/domain`
- [ ] `custom` with shares not summing to the total is rejected — check: `npx vitest run src/domain`
- [ ] Deleted expenses and inactive non-participating families are excluded; balances' `net` values sum to 0 — check: `npx vitest run src/domain`
- [ ] For 4 families, `suggestSettlements` returns at most 3 payments and applying them zeroes every balance — check: `npx vitest run src/domain`
- [ ] `upiLink` output matches expected strings for names with spaces and `&` — check: `npx vitest run src/domain`
- [ ] Line coverage of `src/domain` ≥ 95% — check: `npx vitest run src/domain --coverage`

## Constraints
- No floating-point money anywhere in outputs; weights may be fractional (kids), shares may not.
- Pure functions only; no `Date.now()`, no randomness except in tests (use a seeded generator for
  property tests, e.g. `fast-check`).

## Implementer may decide
Type names, file split, error type design (thrown errors vs result objects).

## Must escalate
Any change to the rounding rule, the split-mode semantics, or the data-model field names.

## Attached content
None.

## Outcome
**Status:** done  
**Commits:** 27b4b27..4aaab75 · **PR:** #3 · **CI run:** https://github.com/X-DSI/trip-budget-tracker/actions/runs/45191293141

### Verified acceptance criteria
All of these ran in the `lint, typecheck, unit tests, build` job of the CI run above (`npm test` includes `src/domain`):
- [x] ₹4,000 per head over 2/4/3/3 gives A/B/C/D 66667/133333/100000/100000 — `allocate.test.ts`, `split.test.ts`
- [x] Property: `allocate` always sums to the total and stays within 1 paisa (2,000 seeded runs) — `allocate.test.ts`
- [x] Itemized: own dishes + per-head shared dishes + proportional extras; shares sum to the bill (plus 1,000-run property test) — `split.test.ts`
- [x] `custom` shares that don't add up are rejected — `split.test.ts`
- [x] Deleted expenses and inactive non-participating families are excluded; nets sum to 0 — `settle.test.ts`
- [x] Four families settle in at most 3 payments, and applying them zeroes every balance (1,000-run property test) — `settle.test.ts`
- [x] `upiLink` encodes names with spaces and `&` — `upi-budget.test.ts`
- [x] `src/domain` line coverage ≥ 95% — enforced by the threshold in `vitest.config.ts`; currently 97.9%

### Deviations
- `balances` returns `sent` and `received` as well as `paid`, `share` and `net`, so the Balances screen can show settlements separately.
- The UPI link keeps the "@" in the payee VPA literal, because some UPI apps don't decode "%40". Names and notes are percent-encoded, and notes are capped at 80 characters.
- Amounts are capped at ₹1 crore (`MAX_PAISE`), which keeps all intermediate maths in safe integers.

### New decisions
- None.

### Questions for the planner
- None.
