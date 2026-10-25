# Contributing to MobilityBridge

These are the team rules. They exist so three people with irregular schedules can build one clean codebase without blocking each other. Want to change a rule? Open a PR that edits this file. That's how rules change here.

## 1. Communication

- **WhatsApp is for quick coordination.** Decisions go in an issue, a PR, or an ADR (`docs/adr/`), because chat gets lost.
- **One voice to NEO.** Haitham speaks for the team, and others join meetings. Nobody contacts NEO separately.
- **Disagree in writing, then commit.** Argue in issue or PR comments. Once something is decided, we all build it.
- **Async standup** in the group, on days you work, 3 lines: *done / next / blocked*.
- **Weekly sync:** 45 minutes, same slot every week. Every two weeks it doubles as a demo of what's working.

## 2. Work tracking

- Every piece of work is an **issue** on the project board. No issue, no work.
- Board columns: `Backlog → Ready → In progress → In review → Done`.
- **Max 2 issues in progress per person.**
- **Quiet-week rule:** if you won't touch your issue for 5+ days, comment and unassign yourself. No shame, nobody gets blocked.

## 3. Git workflow (trunk-based)

`main` is always deployable. **Nobody pushes to `main` directly.** Every change goes through a pull request.

```bash
git switch main && git pull
git switch -c feat/12-otp-login      # type/issue-number-short-name
# ...work, commit small...
git push -u origin feat/12-otp-login
# open a PR on GitHub, link the issue with "Closes #12"
```

**Branch names:** `feat/…`, `fix/…`, `docs/…`, `chore/…`, `refactor/…`, `test/…`, plus the issue number.

**Commit messages:** [Conventional Commits](https://www.conventionalcommits.org/)

```
feat(eligibility): add NOT_YET verdict for certificate gap
fix(auth): rate-limit OTP attempts per email
docs(adr): record decision on session cookies
```

Format: `type(scope): what changed`, in the imperative, lower case, no full stop.

**Branches live 1–3 days.** Long-lived branches are where projects die. If something is big, split it into several PRs.

## 4. Pull requests

- **Small:** aim for under ~400 changed lines. Big PRs get rubber-stamped, not reviewed.
- **Linked** to an issue (`Closes #N`).
- **Description says what and why,** not how. The diff already shows how.
- **UI changes:** screenshots in **both Arabic and English**.
- **1 approving review** from a teammate. You can't approve your own PR.
- **Squash-merge.** One clean commit per PR on `main`.
- **Reviewer's job:** does it do what the issue asked, is it tested, would I understand this in 6 months? Comment on code, not on people.

## 5. Coding with AI

All of us use AI assistants heavily. That's fine, and these are the rules:

1. The assistant must follow [`CLAUDE.md`](CLAUDE.md). Point it there at the start of a session.
2. **You must be able to explain every line of your PR.** The reviewer will ask. "The AI wrote it" is not an answer.
3. **AI-written code ships with tests in the same PR.** No tests, no merge.
4. **No new dependency** without one line in the PR saying why. A new framework needs an ADR.
5. **Never paste** real student data, `.env` files, passwords or API keys into any AI tool.

## 6. Data and secrets: hard rules

This repository is **public**.

- **Never commit secrets.** Use `.env` (git-ignored) locally and GitHub Secrets in CI. If you leak one by mistake, tell Haitham immediately. The key gets rotated; deleting the commit is not enough.
- **Never commit real personal data.** No survey responses, student records, or documents NEO or universities share with us. Demo data only, clearly fake.

## 7. Definition of Done

An issue is done when:

- [ ] Its acceptance criteria are met, in Arabic **and** English
- [ ] Tests are written and CI is green
- [ ] A teammate reviewed and merged it
- [ ] It runs on the shared staging site
- [ ] Docs/ADR are updated if behaviour or structure changed

## 8. Architecture decisions

Anything that changes the architecture, the stack, or a team rule gets an **ADR** in `docs/adr/`: one page covering context, options, decision and consequences. Copy [`0000-template.md`](docs/adr/0000-template.md). ADRs are never edited after they're accepted. A new decision *supersedes* an old one.
