---
title: Adults sign in with Google and join a trip through an invite link
status: Accepted
date: 2026-11-23
deciders: [X-DSI]
origin: web
supersedes: null
superseded_by: null
review: auto
---

## Context
Every adult should be able to add expenses, and we want to know who added each one. Joining must be
easy to share on WhatsApp. Kids don't need accounts; they only affect per-head splits.

## Options
- **One login per family** — simplest; loses who did what, and passwords get shared.
- **Email allowlist** — secure, but the organiser has to collect everyone's email first.
- **Invite link + Google sign-in** — one link in the group chat; each adult signs in and picks their
  family.

## Decision
Use **Firebase Authentication with Google sign-in** (popup on desktop, redirect on mobile/PWA).
A trip organiser creates an **invite link** carrying an unguessable code (at least 128 bits of
randomness). Opening it signs the person in, shows the trip, and asks which family they belong to
(or lets them create a new family). The organiser can turn an invite off and make a new one. Kids
are recorded as a headcount on their family, not as users.

## Consequences
- First sign-in needs a network; after that, Firebase keeps the session offline.
- Roles per trip: `owner` (creator), `organizer`, `member`. Owners and organisers edit trip details,
  families and invites; every member reads the trip and adds expenses.
- Firestore rules must stop anyone without a valid, active invite from joining, and stop members
  from changing their own role.
- Each person signs in before the trip, while on Wi-Fi.
