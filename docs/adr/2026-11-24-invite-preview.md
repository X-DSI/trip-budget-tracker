---
title: Invites carry a preview of the trip and the owner's name
status: Accepted
date: 2026-11-24
deciders: [X-DSI]
origin: web
supersedes: null
superseded_by: null
review: auto
---

## Context
Non-members can't read a trip, so the join page could only say "You're invited to a trip". People
should see what they're joining, and who invited them, before they tap Join.

## Options
- **Join first, show the trip after** — no model change; people join without knowing what it is.
- **Copy a preview onto the invite** — a small data-model change; the preview can go stale unless
  it's refreshed.

## Decision
Each invite stores `tripName`, `tripStartDate`, `tripEndDate`, `tripDestination` and `ownerName`.
To keep it simple, the inviter shown is always the **trip owner**, even when another organiser
made the link. Security rules require the preview to match the trip, so it can't be forged. When
organisers edit the trip, the app refreshes the preview on its active invites in the same batch.

## Consequences
- The join page reads "{owner} invited you to {trip} · {dates} · {destination}".
- Older invites without a preview still work and show a generic invitation.
- If the owner changes their display name, existing invites keep the old name until the trip is
  next edited.
