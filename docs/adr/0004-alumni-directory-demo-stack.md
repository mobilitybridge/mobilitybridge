# ADR-0004: Alumni directory for the NEO demo, built on Vite + Supabase

- **Status:** Proposed. Accepted when this PR is merged.
- **Date:** 2026-11-15
- **Decided by:** Haitham Abu Khaled

## Context

At the November meeting, NEO said they keep their current website. What they need first is a central **alumni directory**: who their Erasmus+ alumni are, where they went, what they do now, and how to reach them. Today that data is spread across spreadsheets. We show a working version at the next meeting, in early December, about two weeks away.

ADR-0003 (Next.js + Spring Boot) was designed for the public student portal: SEO, link previews, an approval workflow, and the Java eligibility engine. The alumni directory needs none of those. It is an admin tool plus one public form. Building login, roles and an API in Spring Boot would take most of the two weeks.

## Options considered

1. **Wait for ADR-0003 and build it in Next.js + Spring Boot:** right for the long term, but auth, roles and the API alone would eat the deadline.
2. **Vite + React SPA on Supabase (Postgres + Auth + Row Level Security):** login, admin-only access and the API come ready, so the time goes into import, directory and dashboard. It's plain Postgres underneath, so the schema moves to Spring Boot + Flyway later.
3. **Google Forms + Sheets:** fastest, but it doesn't solve NEO's actual problem (merging messy sheets and finding duplicates), and it looks like what they already have.

## Decision

Option 2, scoped to `apps/alumni-directory` only. Security lives in the database (row level security plus two functions, `submit_alumni_form` and `import_alumni_batch`), so the browser never decides who can see what. **This does not decide ADR-0003**, which stays open for the student portal.

New dependencies: `@supabase/supabase-js` (client), `exceljs` (read and write .xlsx; SheetJS's current version is only distributed outside npm), `papaparse` (CSV), `i18next` + `react-i18next` (ar/en), `react-router`, `tailwindcss`. `uuid` is overridden to ^11 to clear a moderate advisory in exceljs's dependency.

## Consequences

- Easier: a working demo in two weeks, and anyone on the team can build features, since there's no backend code to wait on.
- Harder: business logic in SQL functions must be tested with SQL (`supabase/tests`), not JUnit.
- Must do: if NEO adopts it, decide hosting (Supabase cloud vs. MoHE servers) at the December meeting. If on-premise, port the migrations to Flyway and the two functions to a Spring Boot service.
- Free Supabase projects pause after a period of inactivity, so open the dashboard the day before any demo.
