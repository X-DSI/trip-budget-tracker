---
title: Expenses are the source of truth; balances are always computed
status: Accepted
date: 2026-11-23
deciders: [X-DSI]
origin: web
supersedes: null
superseded_by: null
review: auto
---

## Context
Phones go offline for hours and sync in any order. A stored running balance updated by several
offline phones would end up wrong, and nobody could tell why.

## Options
- **Stored balances updated per expense** — fast reads; breaks under offline, out-of-order writes.
- **Computed balances** — recomputed from the expense list on each device; always consistent once
  synced.

## Decision
Each expense, budget line and settlement is **its own document**, with an ID generated on the device
(`doc()` auto-ID), so two offline phones can never collide. **Balances, family totals and budget
progress are never stored**; they are computed on the device from the synced documents. Deleting is
a soft delete (`deleted: true`), and every write records `createdBy`/`updatedBy` and server
timestamps.

## Consequences
- Edits to the same expense on two offline phones resolve as last write wins, and the editor is
  visible on the expense.
- Mistakes can be traced and undone.
- The split and settlement maths is a pure TypeScript module with no Firebase imports, so it is
  easy to unit-test.
