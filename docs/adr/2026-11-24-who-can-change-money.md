---
title: Who can change expenses, the budget and settlements
status: Accepted
date: 2026-11-24
deciders: [X-DSI]
origin: web
supersedes: null
superseded_by: null
review: auto
---

## Context
Every adult logs expenses on the road, often offline. Mistakes happen (wrong amount, a duplicate)
and someone has to be able to fix them. The money records also have to stay trustworthy: one
family shouldn't be able to quietly rewrite another's spending, or record a settlement that
didn't involve them.

## Options
- **Expenses:** anyone can edit · creator and organisers can edit · only the creator can edit.
- **Budget:** organisers only · anyone.
- **Settlements:** anyone can record · the paying or receiving family records · receiver only.

## Decision
- **Expenses:** any member adds an expense. Whoever added it, and the trip's organisers, can edit
  or delete it. Deleting is soft (`deleted: true`), so totals can always be traced.
- **Budget:** organisers add, edit and delete budget lines. Everyone can see them, including each
  family's expected share.
- **Settlements:** an adult whose family is the payer or the receiver records a settlement. That
  person, or an organiser, can delete it (soft).
- Firestore rules enforce all of this; the UI only shows controls people may use.

## Consequences
- A member's family must be chosen before they can record a settlement.
- Organisers are the safety net for mistakes, so trips should have at least two organisers.
- Every expense shows who added it and who last edited it.
