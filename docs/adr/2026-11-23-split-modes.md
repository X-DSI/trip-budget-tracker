---
title: Five split modes, chosen per expense, with families as the unit of settlement
status: Accepted
date: 2026-11-23
deciders: [X-DSI]
origin: web
supersedes: null
superseded_by: null
review: auto
---

## Context
Families differ in size (2–4 people, some with kids). Fuel and tolls are usually shared equally per
family; tickets per head; at restaurants one family may eat far more than another. Money moves
between families, not individuals.

## Options
- **Equal split only** — simple; unfair to small families.
- **Per head only** — unfair at restaurants where orders differ.
- **A split mode per expense** — fair in each case; the add-expense form must stay quick.

## Decision
Families are the unit for balances and settlements. Each expense has one `splitMode`:

| Mode | Divides the total |
|---|---|
| `equal_family` | Equally between the families taking part |
| `per_head` | By headcount: `adults + kids × kidWeight` (trip setting, default 0.5) |
| `itemized` | Each item goes to one family or to "shared" (split per head); tax, service charge and tip spread in proportion to each family's item total |
| `custom` | Exact paise per family, which must add up to the total |
| `personal` | Not split; counts only toward the paying family's own spending |

`equal_family`, `per_head` and `itemized` (shared items) take an optional list of participating
families, defaulting to all. Settlement suggestions use a greedy match of the largest debtor with the
largest creditor, which gives at most *n − 1* payments for *n* families.

## Consequences
- The add-expense form defaults to the trip's last-used mode, to stay quick on the road.
- Every mode is covered by unit tests, including rounding and families that leave midway.
- UPI settle-up links (`upi://pay?pa=…&pn=…&am=…&cu=INR&tn=…`) need each family's UPI ID, which is
  optional.
