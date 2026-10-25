# ADR-0001: GitHub Organization and a public monorepo

- **Status:** Accepted
- **Date:** 2026-10-25
- **Decided by:** Haitham Abu Khaled

## Context

Three developers with irregular availability are building a platform that may be handed to the National Erasmus+ Office (NEO) or co-maintained with universities later. Team members' university email accounts are deleted after graduation. We are on GitHub's Free plan.

## Options considered

1. **Repo under a personal account:** simplest, but one person owns everything and others are only collaborators. Hard to hand over.
2. **GitHub Organization, private repo:** proper ownership, but on the Free plan branch protection and rulesets are not enforced on private repos, and Actions minutes are capped.
3. **GitHub Organization, public repo:** proper ownership, enforceable branch protection on Free, unlimited Actions minutes, and portfolio value for the team.

## Decision

Option 3: organization `mobilitybridge`, one public monorepo `mobilitybridge/mobilitybridge`. Apps live under `apps/`, docs under `docs/`.

## Consequences

- `main` can be protected (PR + 1 review + green CI) at no cost.
- The project survives any one person being busy or leaving. Ownership can be shared or transferred to NEO cleanly.
- **Because the repo is public:** no secrets and no real personal data are ever committed (see `CONTRIBUTING.md` §6). Secret scanning and push protection must be on.
- No license yet, so the code is all rights reserved by default. Choose a license together with NEO.
- If NEO requires a private repo, revisit this ADR. Private with enforcement means GitHub Team (paid).
