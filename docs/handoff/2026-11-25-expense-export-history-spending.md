---
title: Expense spreadsheet, who-changed-what, and where the money went
status: in-progress
assignee: X-DSI-agent
base_sha: 12a32c9
adrs: [2026-11-23-offline-first-pwa.md]
plan_pr: 18
impl_pr: null
review: auto
---

## Goal
Families can keep a copy of every expense, see who added or changed each one, and see where the
money is going, even before anyone sets a budget.

## Depends on
Nothing. No data-model or rules change: expenses already store `createdBy`, `updatedBy`,
`createdAt` and `updatedAt`.

## Scope
**In:**
1. **Download expenses (spreadsheet).** A button on Expenses produces a CSV of every non-deleted
   expense with: date, title, category, amount, paid by (family), split, shared by, one column per
   family with its share, note, added by, last edited by. It opens in Excel and Google Sheets
   (UTF-8 with BOM, ₹ only in headers, plain decimal amounts). It works offline. On phones that can
   share files, it opens the share sheet (Save to Files, WhatsApp…); otherwise it downloads.
2. **Who changed what.**
   - Each row in the expense list shows who added it.
   - The edit form (for the person who added it, and organisers) shows "Added by … on …" and,
     if different, "Last edited by … on …", like the read-only view already does.
   - The read-only view adds the dates.
3. **Where the money went.** A card on Money → Budget shows spending by category, largest first,
   with each category's share of the total and your family's share. It is shown whenever there
   are expenses, budget or not. Tapping a category opens Expenses filtered to it, with a clear way
   to remove the filter.

**Out:** Receipt photos; changing how splits are calculated; a full edit history (only the latest
editor is kept).

## Acceptance criteria
- [ ] The CSV holds one row per non-deleted expense and per-family shares that add up to the amount — check: `npm test`
- [ ] Download works offline after an online visit — check: `npm run test:e2e -- --grep @export`
- [ ] The list shows "by <name>"; the edit form shows who added and last edited it — check: `npm run test:e2e -- --grep @expenses`
- [ ] "Where the money went" shows with no budget set, sorted by spend; tapping a category filters Expenses — check: `npm run test:e2e -- --grep @money`
- [ ] Unit: category breakdown (sorting, percentages, your family's share) — check: `npm test`
- [ ] Readable in light and dark; the dark-theme scan stays green — check: `npm run test:e2e -- --grep @theme`
- [ ] The file opens correctly in Google Sheets on a phone — check: manual

## Constraints
- Money stays integer paise until it's formatted for the file.
- Names come from members' display names; an unknown uid shows as "Someone".

## Implementer may decide
File name, column order, where the download button sits, the look of the card.

## Must escalate
Anything that needs a rules or data-model change.

## Attached content
None.
