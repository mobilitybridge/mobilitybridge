# MobilityBridge

**One national Erasmus+ mobility portal for Palestine.**

The National Erasmus+ Office (NEO) sits at the top, each university runs its own space under it, and students and alumni sign in with their university email. The goal is to get every eligible Palestinian student from *"this isn't for me"* to a submitted application, and back again as an alumnus who helps the next student.

Built by **Team Mosaic 3**, first place in the Erasmus Mobility Challenge at تحديات عينك 2026 (Arab Innovation Network).

> **Status: planning (Sprint 0).** No application code yet. The stack is proposed but waits on our meeting with NEO. See [`docs/adr/0003-proposed-stack.md`](docs/adr/0003-proposed-stack.md).

## The student journey v1 covers

| Stage | The problem (our 133-response survey) | What the platform does |
| --- | --- | --- |
| Discover | 42.9% of non-applicants didn't hear in time | Calls published by their own university reach them by email |
| Decide | 44.0% of non-applicants thought they wouldn't be accepted | An eligibility verdict with every criterion explained |
| Apply | Documents were the hardest part for 71.1% of applicants | An ordered checklist with dates worked back from the deadline |
| Prepare | No structured way to ask anyone | Alumni stories filtered by destination |
| Give back | Every cohort starts from zero | Returning students become verified alumni and share their story |

## Principles

1. **AI understands, rules decide.** No AI model ever decides whether a student is eligible.
2. **Missing data never fails a student.** Unknown means "needs confirmation", never "not eligible".
3. **Official sources win.** Every call shows its source link and the date it was verified.
4. **Arabic first, English equal.** RTL is a requirement from day one.
5. **Private by default.** No student's data is shown to anyone else.

## Repository map

```
docs/
  product/   the plan: what we're building and why
  adr/       Architecture Decision Records: every big decision, with its reasons
  setup/     one-time setup guides (GitHub settings, local environment)
.github/     PR + issue templates, code owners
CONTRIBUTING.md   how we work: branches, PRs, reviews, definition of done
CLAUDE.md         rules every AI coding assistant must follow in this repo
```

`apps/web` (frontend) and `apps/api` (backend) arrive after the NEO meeting.

## Team

| Person | Role |
| --- | --- |
| Haitham Abu Khaled ([@Haithamak24](https://github.com/Haithamak24)) | Team lead, architecture, backend, NEO contact |
| Ameer Khamayseh | Frontend lead, universities and outreach |
| *TBC* | Backend |
| Yaman Qabaja *(to confirm)* | Content and alumni community |

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before your first PR. Using an AI assistant? It must follow [`CLAUDE.md`](CLAUDE.md).
