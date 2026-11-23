---
title: Build this project with the agent-workflow protocol
status: Accepted
date: 2026-11-23
deciders: [X-DSI]
origin: web
supersedes: null
superseded_by: null
review: auto
---

## Context
The app is planned in claude.ai and built by coding agents, on a deadline (first trip 4–7 Dec 2026).
Decisions made in chat have to reach the implementer without copy-paste, and the reasons behind
them should stay findable after the trip.

## Options
- **Ad-hoc chat + coding sessions** — fastest to start; decisions get lost between tools.
- **agent-workflow v0.2.0, adopted by hand** — ADRs, handoffs and PRs; a little paperwork per change.
  The copier template isn't ready yet.

## Decision
Adopt agent-workflow protocol v0.2.0 by hand: pinned `docs/PROTOCOL.md`, `AGENTS.md`, code-owned
rule paths, the reusable `commit-identity` CI check, and the agent account `X-DSI-agent` with the
Write role. `firestore.rules` is added to the code-owned paths, because it is the security boundary
for every family's data.

## Consequences
- Every change is a PR; decisions are ADRs; work orders are handoffs with checkable criteria.
- When the agent-workflow template ships, this repo can move onto it with `copier`.
- Maintainer actions: invite `X-DSI-agent` as a Write collaborator; add a `main` ruleset (PR required,
  0 approvals, code-owner review, required checks, no force push, maintainer-only bypass); turn on
  auto-merge and automatic branch deletion.
