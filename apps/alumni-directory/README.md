# Alumni directory (NEO demo)

A central directory of Palestinian Erasmus+ alumni for the National Erasmus+ Office. Why it's built this way: [ADR-0004](../../docs/adr/0004-alumni-directory-demo-stack.md).

| Route | Who | Status |
| --- | --- | --- |
| `/` | Alumni: register or update (public form) | **Ameer**, placeholder |
| `/admin/login` | NEO sign in | Done |
| `/admin` | Directory: search, filters, profile, export | **Omar**, placeholder |
| `/admin/dashboard` | Counts by country, university, year, program | **Omar**, placeholder |
| `/admin/import` | Upload Excel/CSV → map columns → review duplicates → save | Done |

## Setup (about 10 minutes, once per person)

1. **Supabase:** create a free project at supabase.com. Haitham shares one project with the team, so only one person does this.
2. **Database:** in the Supabase **SQL Editor**, run these files in order:
   1. `supabase/migrations/20261115000001_alumni_schema.sql`
   2. `supabase/migrations/20261115000002_alumni_security_and_functions.sql`
   3. `supabase/seed.sql` (203 fake alumni, 10 universities)
3. **Admin login:** go to Authentication → Users → Add user (email + password, tick *Auto confirm*). Then run this in the SQL Editor:
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';
   ```
4. **App:**
   ```bash
   cd apps/alumni-directory
   cp .env.example .env   # paste the Project URL and anon key from Project Settings → API
   npm install
   npm run dev            # http://localhost:5173/admin/login
   ```

## Try the import (this is the demo)

Sign in, open **Import**, and upload `demo-data/neo_sample_messy.csv`. It's built to look like a real office sheet: mixed Arabic and English headers, "PPU" vs "بوليتكنك فلسطين", "Germany" vs "ألمانيا", "2023/24" vs "23/24". With the seed loaded, the review screen should show:

- **14 new people.** One of them has two trips in two rows, grouped into one person.
- **2 already in the directory** with the same email (typed in capitals). The default is to merge into the existing record.
- **1 possible duplicate**: a respelled name with no email, at the same university. It's flagged, and NEO decides.
- **2 rows that can't be imported**: one with no name, one with the country "Atlantis".

Change one possible duplicate to "Same person", save, and you get the result counts.

## For the other features

**Data model:** `alumni` 1 → many `mobilities`. Countries are ISO codes (`countryName()` in `src/features/import/countries.ts` gives the Arabic or English name). `possible_duplicate_of` marks records NEO should check. `visibility` stays `neo_only` unless the person consented.

**Public form (Ameer):** anonymous users can't insert into tables directly. Call the function, which validates the input, stores consent, and flags a repeated email instead of overwriting:

```ts
await supabase.rpc('submit_alumni_form', {
  p: {
    full_name_ar: 'سارة عودة', full_name_en: 'Sara Odeh', email: 'sara@example.com', consent: true,
    home_university_id: 3, visibility: 'alumni',         // 'neo_only' | 'alumni' | 'public'
    field_of_study: 'Computer Science', current_job_title: 'Software Engineer',
    current_organization: '...', current_country: 'PS', linkedin_url: '...', story: '...',
    mobilities: [{ program: 'credit_mobility', level: 'bachelor', host_country: 'RO',
                   host_institution: 'Dunărea de Jos University of Galați', academic_year: '2025/2026' }],
  },
});
```

`universities` is readable by everyone, so use it for the dropdown.

**Directory and dashboard (Omar):** a signed-in admin can `select` from `alumni`, `mobilities` and `universities` directly, for example `supabase.from('alumni').select('*, mobilities(*), universities(name_en, name_ar)')`. Use `exceljs` (already installed) for the .xlsx export so Arabic stays readable.

## Tests

```bash
npm test          # import logic, locales, and the full demo scenario
npm run test:db   # schema, security rules and functions on a local PostgreSQL 16
                  # (needs createdb/psql; set PGHOST/PGPORT/PGUSER if not the defaults)
npm run demo-data # regenerate seed.sql + the demo sheet (deterministic)
```

All data in this folder is invented. Never commit a real NEO sheet. The repo is public.
