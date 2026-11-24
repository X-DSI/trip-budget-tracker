---
title: Budget vs actual, balances and UPI settle-up
status: in-progress
assignee: X-DSI-agent
base_sha: b15053f
adrs: [2026-11-23-split-modes.md, 2026-11-23-expenses-are-the-source-of-truth.md, 2026-11-24-who-can-change-money.md]
plan_pr: 8
impl_pr: null
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
