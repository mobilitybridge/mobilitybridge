# ADR-0003: Application stack

- **Status:** Proposed. Waiting on the NEO meeting (hosting, domain and data-location requirements may change it)
- **Date:** 2026-10-25
- **Proposed by:** Haitham Abu Khaled

## Context

- A public national portal that must be found on Google and previewed nicely in WhatsApp, so it needs server-side rendering.
- Arabic-first with full RTL, and English equal.
- Multi-tenant permissions (NEO → universities → users) and approval workflows.
- An existing, tested eligibility engine in Java (201 passing tests) from the hackathon finals.
- Team: Haitham is strongest in Spring Boot. Ameer and the third teammate's skills are still being confirmed, and they code heavily with AI.
- Must be portable to NEO/MoHE servers if they adopt it.

## Options considered

1. **Next.js frontend + Spring Boot API + PostgreSQL:** reuses the Java engine, a strong security/permissions model, plays to the lead's strength. Risk: backend bus factor of one.
2. **All TypeScript (Next.js full-stack + Prisma/Drizzle + PostgreSQL):** one language, anyone can touch anything. The engine must be ported, and the permissions/workflow tooling is less mature.
3. **Vite React SPA + Spring Boot:** simpler frontend, but poor SEO and link previews for a public portal.

## Proposed decision

Option 1:

| Layer | Choice |
| --- | --- |
| Web | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Motion, next-intl |
| API | Spring Boot on Java 21, Spring Modulith (module boundaries), Spring Security, Spring Data JPA |
| DB | PostgreSQL 16, Flyway migrations |
| Contract | OpenAPI (springdoc) → generated TypeScript client |
| Auth | Email one-time code → server session cookie (Spring Session JDBC), proxied same-origin through Next.js |
| Local dev | Docker Compose: Postgres, Mailpit, MinIO |
| Hosting (start) | Free tiers, everything in Docker, so it can move to NEO/MoHE servers |

**Mitigation for the bus factor:** the third teammate is backend #2 from Sprint 0 and pairs on backend issues. The contract-first API means the frontend never waits on the backend.

## Consequences

To be completed when this ADR is accepted. Accepting it unblocks scaffolding `apps/web` and `apps/api`.
