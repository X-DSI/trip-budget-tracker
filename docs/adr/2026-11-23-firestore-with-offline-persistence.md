---
title: Cloud Firestore with persistent offline cache, in asia-south1, on the free plan
status: Accepted
date: 2026-11-23
deciders: [X-DSI]
origin: web
supersedes: null
superseded_by: null
review: auto
---

## Context
Several phones add and edit data while offline and must agree once they reconnect. Writing our own
sync and conflict handling isn't possible in 11 days. Hosting must be free, and must not surprise
anyone with a bill.

## Options
- **Supabase** — good Postgres, but no built-in offline sync, and free projects pause after a week
  of low activity, which could leave the database paused on day one of the trip.
- **PocketBase or a self-hosted server** — needs a server to stay up; no offline sync.
- **Cloud Firestore** — built-in offline cache with queued writes and automatic sync; free Spark plan
  stops at its quota instead of billing.

## Decision
Use **Cloud Firestore** (Standard edition, the `(default)` database) on the **Spark** plan, located
in **`asia-south1` (Mumbai)**. Initialise it with `persistentLocalCache` and
`persistentMultipleTabManager`, so data and pending writes survive app restarts and multiple tabs.
Firestore security rules enforce who can read and write; the rules are tested on the local emulator.

## Consequences
- The database location cannot be changed after creation; `asia-south1` is closest to the users.
- Free quota (about 50k reads and 20k writes a day) is far above our use, but a listener that is
  offline for over 30 minutes re-reads its query on reconnect. Keep queries scoped to one trip.
- Cloud Storage is not on the Spark plan, so receipt photos are out of scope for v1.
- The UI shows which writes are still pending (`hasPendingWrites`), so people know what hasn't
  synced yet.
