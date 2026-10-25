# ADR-0002: Team workflow (trunk-based, PR review, async-first)

- **Status:** Accepted
- **Date:** 2026-10-25
- **Decided by:** Haitham Abu Khaled (team to confirm at kickoff)

## Context

The three developers are students with internships and other projects. Availability changes week to week. Two of us rely heavily on AI-assisted coding. Previous work on this project was chaotic: three versions of the product, never merged.

## Options considered

1. **GitFlow** (develop/release/hotfix branches): heavy ceremony for a team this size, and long-lived branches drift.
2. **Trunk-based with short-lived branches + PR review:** small changes, always-deployable `main`, review as the quality gate.
3. **No process, push to main:** fast for a week, chaos after that.

## Decision

Option 2, as described in `CONTRIBUTING.md`:

- Short branches (1–3 days), Conventional Commits, squash-merge.
- PRs under ~400 lines, 1 approving review, CI green.
- GitHub Issues + Projects board, WIP limit 2 per person, quiet-week rule.
- Async standup in chat, one 45-minute weekly sync, a demo every two weeks.
- Decisions recorded as ADRs, never only in chat.
- AI assistants follow `CLAUDE.md`. Authors must be able to explain every line.

## Consequences

- Review becomes the bottleneck, so PRs must stay small and reviews happen within 48 hours.
- Nobody, including the lead, can push to `main`, so branch protection is enforced, not just agreed.
- New members onboard by reading `README.md` → `CONTRIBUTING.md` → `CLAUDE.md`.
