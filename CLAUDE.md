# CLAUDE.md: rules for AI assistants in this repo

You are helping build **MobilityBridge**, a national Erasmus+ mobility portal for Palestine. Read this file fully before writing code. If a request conflicts with these rules, say so instead of silently breaking them.

## Project state

- **Planning stage (Sprint 0).** There is no application code yet.
- The stack in `docs/adr/0003-proposed-stack.md` is **Proposed, not Accepted**. Do not scaffold `apps/web` or `apps/api` until that ADR is marked Accepted.
- Product context: `docs/product/plan.md`. Team rules: `CONTRIBUTING.md`.

## Non-negotiable product rules

1. **AI understands, rules decide.** No language model may produce, change or "soften" an eligibility verdict. Verdicts come only from the deterministic rules engine. The engine module must have no dependency on any AI or network module.
2. **Missing data never fails a student.** Unknown or unprovided values resolve to `UNKNOWN` → "needs confirmation", never to "not eligible".
3. **Never imply acceptance probability.** No text may tell a student their chance of being accepted.
4. **Official sources win.** Every opportunity has a source URL and a verified-at date.
5. **Privacy.** Staff and officers never see an individual student's GPA or verdicts. Stats are aggregate only, with a minimum group size of 5.

## Repository rules

- **Never commit secrets** (`.env`, keys, tokens, passwords) or **real personal data** (survey responses, student records). The repo is public. Use clearly fake demo data.
- **Never push to `main`.** Work on a branch named `type/issue-short-name` and open a PR.
- **Conventional Commits:** `type(scope): imperative summary`.
- **Small PRs** (under ~400 changed lines). Split larger work.
- **Every behaviour change ships with tests in the same PR.**
- **No new dependency** without justifying it in the PR description. A new framework requires an ADR.
- **Prefer editing existing code** over adding parallel versions of it. No dead code, no commented-out blocks.

## Arabic / RTL rules (frontend)

- Every user-facing string goes through i18n with **both** `ar` and `en` entries. No hard-coded UI text.
- Use **logical** CSS properties and Tailwind classes: `ms-`/`me-`, `ps-`/`pe-`, `start-`/`end-`, `text-start`/`text-end`. **Never** `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left`, `text-right`.
- Set `dir` on `<html>` from the locale. Icons that imply direction (arrows, chevrons) must flip in RTL.
- Test every UI change in both locales.

## Design rules

- Use a pattern only where it removes a real problem (see `docs/product/plan.md`). Do not introduce CQRS, event sourcing, generic repositories or abstract base services.
- Keep module boundaries: one module never reaches into another module's internals.
- Entities never leave the API layer as JSON. Map to DTOs at the controller edge.

## When unsure

Ask in the PR description or as a question to the developer. Do not guess at domain rules (Erasmus+ eligibility, NEO processes). Mark assumptions as `ASSUMPTION:` in code comments and PR text.
