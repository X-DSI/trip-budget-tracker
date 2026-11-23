---
title: Store and compute money as integer paise, rounding by largest remainder
status: Accepted
date: 2026-11-23
deciders: [X-DSI]
origin: web
supersedes: null
superseded_by: null
review: auto
---

## Context
Splitting ₹4,000 across 12 people gives ₹333.33…. Floating-point rupees drift, and a split whose
parts don't add up to the bill makes people distrust the app.

## Options
- **Float rupees, round on display** — easy; totals drift by paise and balances never quite reach 0.
- **Decimal library** — exact, but extra weight and still needs a rounding rule.
- **Integer paise + largest-remainder rounding** — exact, simple, totals always match.

## Decision
Every amount is stored and computed as an **integer number of paise** (`amountPaise`). When a split
leaves fractions, each share is floored, and the leftover paise go one each to the shares with the
largest fractional remainders. Ties are broken by a stable order (family `order`, then ID). The
currency is INR only in v1.

## Consequences
- The sum of shares always equals the expense total, exactly.
- Input fields accept rupees with up to 2 decimals and convert them once, at entry.
- Display formatting uses `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.
