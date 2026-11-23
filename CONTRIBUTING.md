# Contributing

Humans and AI agents follow the same rules here: **[docs/PROTOCOL.md](docs/PROTOCOL.md)**, from
[agent-workflow](https://github.com/X-DSI/agent-workflow).

1. Anything non-trivial starts as a `plan/` PR with an ADR or a handoff.
2. Do the work on a branch and open a pull request. Nothing is pushed straight to `main`.
3. Add a fragment to `changelog.d/` if behaviour changes.
4. Use your own git identity, and don't add AI co-author trailers.

Changes to agent instructions, decided ADRs or CI always need the maintainer's review. Everything
else merges once CI is green.
