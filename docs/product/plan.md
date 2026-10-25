# MobilityBridge: product plan (kickoff version)

*Last updated: 2026-10-25. The full technical draft (stack, architecture, data model, roadmap) is parked until after the NEO meeting. Its decisions arrive here as ADRs.*

## What we're building

One platform with three levels:

```
                 National Erasmus+ Office (NEO)
           national pages · news · documents · national calls
                              │
        ┌─────────────────────┼─────────────────────┐
     PPU space          University B space      more universities…
  office publishes calls, info sessions, approves alumni
        │
  Students & alumni: sign in with university email
  profile → eligibility verdict → action plan → alumni story
```

It brings together everything the team built before:

| Earlier version | What we keep |
| --- | --- |
| July concept + semi-final (community platform) | Journey guide content, alumni stories, privacy-first alumni design |
| Finals + verdict engine (decision tool) | Deterministic eligibility engine (201 passing tests), 4 verdicts, action plan |
| Ameer's static site (Oct 2026) | Arabic-first copy, look and feel, public page structure |
| NEO's request | Becomes the spine: national → university → student |

## How roles work

- **A verified university email proves affiliation, not role.** `@ppu.edu.ps` makes you a *Student at PPU*, and nothing more.
- **Staff roles come only by invitation.** NEO invites each university's first admin, and that admin invites their officers.
- **Alumni status** comes when your home university's officer approves your mobility record.
- **Every account can add a personal email**, because universities delete student emails after graduation.
- Officers never see an individual student's GPA or verdicts. Stats are aggregate only.

| Role | Can do |
| --- | --- |
| Visitor | Read public pages, opportunities, stories |
| Student | + profile, eligibility verdicts, action plans, submit mobility record |
| Alumnus | + publish own story (after approval) |
| University Officer | Publish own university's calls, sessions, page; approve alumni and stories |
| University Admin | + invite/remove officers |
| NEO Editor | National pages, news, resources, national calls |
| NEO Admin | + onboard universities and their email domains |

## Scope

**Phase 1 (v1), the thin full loop:**

| ID | Feature |
| --- | --- |
| P1-01 | National portal (bilingual public pages) |
| P1-02 | Content management for NEO editors |
| P1-03 | University directory + university spaces |
| P1-04 | Accounts: email one-time code, university detection, personal email |
| P1-05 | Invitations and roles |
| P1-06 | Opportunity publishing with structured criteria |
| P1-07 | Opportunity browse and filters |
| P1-08 | Student profile |
| P1-09 | Eligibility verdict + criterion breakdown |
| P1-10 | Action plan with dated steps and saved progress |
| P1-11 | Mobility record → verified alumnus |
| P1-12 | Alumni stories (named or anonymous, approved by office) |
| P1-13 | Email alert when a matching call is published |

**Phase 2, after the v1 pilot:** alumni directory + mediated contact, live Q&A archive, Reality Check, AI major normalization, AI call extraction (human-approved), university dashboard, alumni matching.

**Not building:** a chatbot or free-text AI assistant, a crawler, real-time chat, payments, visa services, our own video hosting, a native mobile app.

## Open questions for NEO

1. Replace erasmus-plus.mohe.pna.ps, run alongside it, or be linked from it?
2. Who on their side publishes content and approves universities?
3. Any MoHE requirements for hosting, domain, or where student data lives?
4. Which 2 universities pilot first, and who are their international office contacts?
5. The list of Palestinian HEIs in Erasmus+ and their email domains?
6. Which content from the current site must move over?

## Open questions for the team

- Third teammate: name, GitHub username, experience.
- Yaman: in, and in which role?
- License: none yet (all rights reserved by default). Decide with NEO before choosing an open-source license.
