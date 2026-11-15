import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildRecords } from './buildRecords';
import { guessMapping, missingRequired } from './columns';
import { findMatches, summarize, toImportPayload, type ExistingAlumnus } from './dedupe';
import { parseCsvText, type Sheet } from './readSheet';

const universities = [
  { id: 1, name_en: 'Birzeit University', name_ar: 'جامعة بيرزيت', aliases: ['BZU'] },
  { id: 2, name_en: 'Palestine Polytechnic University', name_ar: 'جامعة بوليتكنك فلسطين', aliases: ['PPU'] },
];

const sheet = (headers: string[], ...rows: string[][]): Sheet => ({ headers, rows });

describe('guessMapping', () => {
  it('maps mixed Arabic/English headers and keeps "University" apart from "Host University"', () => {
    const m = guessMapping(['الاسم', 'Name (English)', 'E-mail', 'الجامعة', 'Host Country', 'Host University', 'Academic Year']);
    expect(m.full_name_ar).toBe(0);
    expect(m.full_name_en).toBe(1);
    expect(m.email).toBe(2);
    expect(m.home_university).toBe(3);
    expect(m.host_country).toBe(4);
    expect(m.host_institution).toBe(5);
    expect(m.academic_year).toBe(6);
    expect(missingRequired(m)).toEqual([]);
  });
  it('reports what is missing', () => {
    expect(missingRequired(guessMapping(['Email', 'Country']))).toEqual(['full_name_en', 'host_institution']);
  });
});

describe('buildRecords', () => {
  const headers = ['Name', 'Email', 'University', 'Host Country', 'Host University', 'Program', 'Academic Year'];
  const mapping = guessMapping(headers);

  it('groups two trips of the same person into one alumnus with two mobilities', () => {
    const result = buildRecords(
      sheet(
        headers,
        ['Sara Odeh', 'sara@example.com', 'PPU', 'Spain', 'University of Granada', 'KA171', '2022-2023'],
        ['Sarah Odeh', 'SARA@example.com', 'PPU', 'Italy', 'University of Bologna', 'Erasmus Mundus', '2024/25'],
      ),
      mapping,
      universities,
    );
    expect(result.people).toHaveLength(1);
    expect(result.people[0].rows).toEqual([2, 3]);
    expect(result.people[0].mobilities.map((m) => m.host_country)).toEqual(['ES', 'IT']);
    expect(result.people[0].mobilities[1].program).toBe('erasmus_mundus');
  });

  it('puts an Arabic name found in an English name column into full_name_ar', () => {
    const result = buildRecords(sheet(headers, ['سارة عودة', '', 'BZU', 'RO', 'Babeș-Bolyai University', 'KA171', '2023']), mapping, universities);
    expect(result.people[0].alumni).toMatchObject({ full_name_ar: 'سارة عودة', full_name_en: null, home_university_id: 1 });
  });

  it('rejects rows without a name or with an unknown country, and warns on soft problems', () => {
    const result = buildRecords(
      sheet(
        headers,
        ['', 'x@example.com', 'PPU', 'Spain', 'University of Granada', 'KA171', '2023'],
        ['Rami Issa', '', 'PPU', 'Atlantis', 'Lost University', 'KA171', '2023'],
        ['Rana Issa', 'broken-email', 'Some College', 'Spain', 'University of Granada', '???', 'last year'],
      ),
      mapping,
      universities,
    );
    expect(result.errors.map((e) => [e.row, e.code])).toEqual([
      [2, 'missing_name'],
      [3, 'unknown_country'],
    ]);
    expect(result.warnings.map((w) => w.code).sort()).toEqual(['invalid_email', 'unknown_program', 'unknown_university', 'unreadable_year']);
    expect(result.people).toHaveLength(1);
  });
});

describe('findMatches', () => {
  const existing: ExistingAlumnus[] = [
    { id: 'a', full_name_en: 'Mohammad Al-Sharif', full_name_ar: 'محمد الشريف', email: 'm.sharif@example.com', home_university_id: 2 },
    { id: 'b', full_name_en: 'Lina Haddad', full_name_ar: null, email: 'lina@example.com', home_university_id: 1 },
  ];
  const person = (alumni: Partial<ExistingAlumnus>) => ({
    rows: [2],
    mobilities: [],
    alumni: { full_name_en: null, full_name_ar: null, email: null, phone: null, gender: null, home_university_id: null,
      field_of_study: null, current_job_title: null, current_organization: null, linkedin_url: null, ...alumni },
  });

  it('merges by email, flags a respelled name at the same university, and inserts the rest', () => {
    const decisions = findMatches(
      [
        person({ full_name_en: 'Lina H.', email: 'lina@example.com', home_university_id: 1 }),
        person({ full_name_en: 'Muhammed Sharif', home_university_id: 2 }),
        person({ full_name_en: 'Muhammed Sharif', home_university_id: 1 }),
        person({ full_name_en: 'Muhammed Sharif', email: 'other@example.com', home_university_id: 2 }),
      ],
      existing,
    );
    expect(decisions.map((d) => [d.match?.kind ?? null, d.match?.existing.id ?? null, d.action])).toEqual([
      ['email', 'b', 'merge'],
      ['name', 'a', 'insert'],
      [null, null, 'insert'],
      [null, null, 'insert'],
    ]);
    expect(summarize(decisions)).toEqual({ total: 4, newPeople: 2, sameEmail: 1, possibleDuplicates: 1 });

    const payload = toImportPayload(decisions);
    expect(payload[0]).toMatchObject({ action: 'merge', merge_into: 'b', possible_duplicate_of: null });
    expect(payload[1]).toMatchObject({ action: 'insert', merge_into: null, possible_duplicate_of: 'a' });
  });
});

describe('the demo sheet against the demo seed', () => {
  // The exact scenario we show NEO: demo-data/neo_sample_messy.csv imported into a database
  // loaded with supabase/seed.sql. Both come from scripts/generate_demo_data.py.
  const csv = readFileSync(new URL('../../../demo-data/neo_sample_messy.csv', import.meta.url), 'utf-8');
  const seedSql = readFileSync(new URL('../../../supabase/seed.sql', import.meta.url), 'utf-8');

  const seedUniversities = [...seedSql.matchAll(/universities \(name_en, name_ar, city, aliases\) values \('([^']+)', '([^']+)', '[^']+', array\[([^\]]*)\]/g)]
    .map((m, i) => ({ id: i + 1, name_en: m[1], name_ar: m[2], aliases: [...m[3].matchAll(/'([^']+)'/g)].map((a) => a[1]) }));
  const universityId = (name: string) => seedUniversities.find((u) => u.name_en === name)!.id;
  const seedAlumni: ExistingAlumnus[] = [...seedSql.matchAll(
    /values \('([0-9a-f-]{36})', '([^']+)', '([^']+)', '([^']+)', '[a-z]+', \(select id from public\.universities where name_en = '([^']+)'\)/g,
  )].map((m) => ({ id: m[1], full_name_en: m[2], full_name_ar: m[3], email: m[4], home_university_id: universityId(m[5]) }));

  it('finds every planted case', () => {
    expect(seedUniversities).toHaveLength(10);
    expect(seedAlumni.length).toBeGreaterThanOrEqual(200);

    const parsed = parseCsvText(csv);
    const mapping = guessMapping(parsed.headers);
    expect(missingRequired(mapping)).toEqual([]);

    const built = buildRecords(parsed, mapping, seedUniversities);
    expect(built.errors.map((e) => e.code).sort()).toEqual(['missing_name', 'unknown_country']);
    expect(built.warnings.filter((w) => w.code === 'unknown_university')).toEqual([]);
    expect(built.people.some((p) => p.mobilities.length === 2 && p.rows.length === 2)).toBe(true);

    const summary = summarize(findMatches(built.people, seedAlumni));
    expect(summary.sameEmail).toBe(2);
    expect(summary.possibleDuplicates).toBe(1);
    expect(summary.newPeople).toBe(14);
  });
});
