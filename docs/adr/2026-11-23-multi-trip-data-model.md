---
title: Many trips per user, one active; everything lives under its trip
status: Accepted
date: 2026-11-23
deciders: [X-DSI]
origin: web
supersedes: null
superseded_by: null
review: auto
---

## Context
This trip is the first, but the same families will travel again. The app should centre on one trip
at a time: the dashboard, budget and expenses all belong to it.

## Options
- **Single hard-coded trip** — slightly simpler screens; has to be rebuilt for the next trip.
- **Many trips, one active** — same cost now; a trip switcher appears only when someone has more
  than one trip.

## Decision
A user can belong to many trips and has one **active trip** (`users/{uid}.activeTripId`). Every
trip-scoped record — legs, families, members, expenses, budget lines, settlements — lives in a
subcollection under `trips/{tripId}`. The trip holds a `memberUids` array, so "my trips" is one
`array-contains` query and rules can check membership cheaply. The full layout is in
[`docs/data-model.md`](../data-model.md).

## Consequences
- Offline queries stay small: one trip's subcollections.
- Security rules are written once, per trip.
- Changing the layout later means a migration, so changes to `docs/data-model.md` are escalations.
