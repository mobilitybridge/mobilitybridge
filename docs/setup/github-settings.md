# GitHub settings checklist (one-time, org owner)

Click through these once. Each takes under a minute.

## Repository: `mobilitybridge/mobilitybridge` → Settings

**General**
- [ ] Visibility: **Public** (Danger Zone → Change visibility)
- [ ] Pull Requests: allow **squash merging** only (untick merge commits and rebase merging)
- [ ] Tick **Always suggest updating pull request branches**
- [ ] Tick **Automatically delete head branches**
- [ ] Features: tick **Issues**, untick **Wiki** (docs live in `docs/`)

**Rules → Rulesets → New branch ruleset**
- [ ] Name: `protect-main` · Enforcement: **Active**
- [ ] Target branches: **Include default branch**
- [ ] Tick **Restrict deletions**
- [ ] Tick **Block force pushes**
- [ ] Tick **Require a pull request before merging**
  - Required approvals: **1**
  - Tick **Dismiss stale pull request approvals when new commits are pushed**
  - Tick **Require review from Code Owners** (once teammates are in teams)
  - Tick **Require conversation resolution before merging**
- [ ] Tick **Require status checks to pass** (add the CI checks once CI exists)
- [ ] Bypass list: **leave empty**, so the rules apply to the lead too

**Code security** (Advanced Security section)
- [ ] **Secret scanning:** enable
- [ ] **Push protection:** enable (blocks a push that contains a key)
- [ ] **Dependabot alerts** and **Dependabot security updates:** enable
- [ ] **Private vulnerability reporting:** enable

## Organization: `mobilitybridge` → Settings

- [ ] **Authentication security:** tick **Require two-factor authentication** for everyone in the org
- [ ] **Member privileges:** Base permissions **Read** (access comes through teams)
- [ ] **Member privileges:** untick **Repository creation** for members
- [ ] **Teams:** create `backend`, `frontend`, `content`, then give each **Write** on the repo
- [ ] **People:** invite teammates once they send their GitHub usernames (they need 2FA on first)
- [ ] Add a second **owner** (Ameer) once he has joined, so the org never depends on one account

## Project board

- [ ] Org → **Projects → New project → Board**, named `MobilityBridge`
- [ ] Columns: `Backlog`, `Ready`, `In progress`, `In review`, `Done`
- [ ] Link it to the repo (Project settings → Manage access / Repository → Projects tab → Link)
