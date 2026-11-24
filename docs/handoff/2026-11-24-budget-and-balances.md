---
title: Budget vs actual, balances and UPI settle-up
status: done
assignee: X-DSI-agent
base_sha: b15053f
adrs: [2026-11-23-split-modes.md, 2026-11-23-expenses-are-the-source-of-truth.md, 2026-11-24-who-can-change-money.md]
plan_pr: 8
impl_pr: 10
review: human
---

## Goal
Families see how much the trip should cost them, how much it actually has, who owes whom, and can
settle up over UPI in one tap.

## Depends on
[Expenses](2026-11-24-expenses.md) merged.

## Scope
**In:**
- **Budget** (a section on the Trip tab):
  - organisers add, edit and delete budget lines: category, title, amount, split mode
    (equal / per head / custom / personal), participants;
  - everyone sees the total and each family's planned share (`familyBudgetShares`);
  - **budget vs actual** by category and by family, with a simple progress bar.
- **Balances tab:**
  - per family: paid, share, settlements, and a net figure ("owes ₹X" / "gets back ₹X"), using
    `balances`;
  - suggested payments (`suggestSettlements`), each with:
    - **Pay with UPI** (`upiLink`) when the receiving family has a UPI ID;
    - **Mark as paid**, which records a settlement;
  - settlement history with soft delete;
  - recording follows the who-can-change-money ADR: payer or receiver family, and you must have
    picked your family.
- **Firestore rules** for `budget` and `settlements`.
- **Dashboard:**
  - fill "Your family's balance" during and after the trip;
  - tick the checklist's "Budget set" item once any budget line exists.

**Out:** Exporting to a spreadsheet (later), reminders.

## Acceptance criteria
- [ ] Rules: only organisers write budget lines; settlements only by an adult of the paying or receiving family; deletion only by its creator or an organiser — check: `npm run test:rules`
- [ ] E2E: with expenses from two families, the Balances tab shows nets that sum to zero, suggests at most n − 1 payments, and after "Mark as paid" for each, everyone is settled — check: `npm run test:e2e -- --grep @balances`
- [ ] E2E: a budget of ₹12,000 equal + ₹36,000 per head over 2/4/3/3 adults shows each family's planned share — check: `npm run test:e2e -- --grep @budget`
- [ ] The UPI button opens a UPI app with payee, amount and note filled in — check: manual

## Constraints
- Balances are computed on the device from synced documents, never stored.
- The UPI button is a plain link; never ask for or store payment details.

## Implementer may decide
Charts or bars for budget vs actual; wording of balance lines.

## Must escalate
Any change to how settlements affect balances; storing anything derived from expenses.

## Attached content
None.

## Outcome
**Status:** done (one manual check left for the maintainer)  
**Commits:** 63fde83..3958f82 · **PR:** #10 · **CI run:** https://github.com/X-DSI/trip-budget-tracker/actions/runs/45390445138

### Verified acceptance criteria
Passed locally and in the CI run above (rules, unit and e2e jobs, phone and desktop). PR number
and CI link filled in after merge by the planner's review.
- [x] Rules: only organisers write budget lines; settlements only by an adult of the paying or receiving family (a member with no family, another family, or an organiser of another family is refused); only the recorder or an organiser deletes, and only softly — `npm run test:rules`, `tests/rules/money.test.ts`
- [x] E2E: two families pay; nets sum to zero; 2 suggested payments for 3 families; after "Mark as paid" on each (the first one offline) everyone is settled; deleting a payment brings the debt back — `npm run test:e2e -- --grep @balances`, phone and desktop
- [x] E2E: ₹12,000 equal + ₹36,000 per head over 2/4/3/3 adults shows ₹9,000 / ₹15,000 / ₹12,000 / ₹12,000 — `npm run test:e2e -- --grep @budget`, phone and desktop
- Also: unit tests for the budget form, budget vs actual, balances, labels, UPI links and permissions (`npm test`); the full e2e suite still passes.

### Unverified (manual) criteria
- [ ] The UPI button opens a UPI app with payee, amount and note filled in — needs a real phone with a UPI app. The link it opens is unit-tested (`src/features/balances/model.test.ts`).

### Deviations
- **Settlements can't be edited, only deleted or restored**, even by organisers. The data-model access table says organisers can "edit or delete anyone's … settlement". The handoff and the ADR only ask for deletion, so the rule is narrower: to fix a payment, delete it and record it again. Widening it later is a small rules change.
- "Pay with UPI" shows only to the paying family (it pays from your own phone). Others see the suggestion and, if their family receives it, "Mark as paid".
- Deleted settlements are hidden from the history, like deleted expenses.
- Budget vs actual for a family compares its planned share with its **share** of real expenses (not what it happened to pay), so the two are like for like.
- Test helper `pickMyFamily` now waits for the write to sync. It used to navigate away at once, which sometimes lost the write and made the new balances test flaky on desktop.
- Shared e2e helpers (`istDate`, `setDates`, `pickMyFamily`, `openAddExpense`) moved to `e2e/trip-helpers.ts`.

### New decisions
- None.

### Questions for the planner
- A write made a split second before a full page reload can be lost: Firestore puts it in the offline queue asynchronously. Normal in-app navigation is fine. Should the dry run include "save, then swipe the app closed at once" on a real phone?
- Locally, the Firestore emulator started by `npm run test:e2e` is left running after Playwright exits (orphaned Java process on :8080), so the next run fails to start until it's killed. CI is unaffected.

### Planner review (2026-11-24, after merge)
- Rules match the who-can-change-money ADR; money maths goes through `src/domain`; deviations
  accepted.
- Process notes: pushed from the maintainer's account (agent token unavailable; disclosed in the
  PR), and the Outcome was written before the PR existed. Next time, open the PR first and fill in
  the PR number and CI link before asking for review.
- Questions answered: the "close the app right after saving" case is now in
  [`docs/dry-run.md`](../dry-run.md); the leftover local emulator is fixed in the same PR as this
  review.
