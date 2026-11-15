// Step 3 of the import: sheet rows → people, each with one or more mobilities.
// Office sheets usually have one row per trip, so one person can span several rows.

import type { ColumnMapping, TargetField } from './columns';
import type { Sheet } from './readSheet';
import {
  hasArabic,
  matchUniversity,
  nameKey,
  normalizeEmail,
  parseAcademicYear,
  parseCountry,
  parseDate,
  parseGender,
  parseLevel,
  parseProgram,
  type Level,
  type Program,
  type UniversityRef,
} from './normalize';

export interface ImportAlumnus {
  full_name_en: string | null;
  full_name_ar: string | null;
  email: string | null;
  phone: string | null;
  gender: 'female' | 'male' | null;
  home_university_id: number | null;
  field_of_study: string | null;
  current_job_title: string | null;
  current_organization: string | null;
  linkedin_url: string | null;
}

export interface ImportMobility {
  program: Program;
  level: Level | null;
  host_country: string;
  host_institution: string;
  academic_year: string | null;
  start_date: string | null;
  end_date: string | null;
}

export type IssueCode =
  | 'missing_name'
  | 'unknown_country'
  | 'missing_host_institution'
  | 'unknown_university'
  | 'unreadable_year'
  | 'unknown_program'
  | 'invalid_email';

/** row = the spreadsheet row number as NEO sees it in Excel (header is row 1). */
export interface RowIssue {
  row: number;
  code: IssueCode;
  value?: string;
}

export interface ImportPerson {
  rows: number[];
  alumni: ImportAlumnus;
  mobilities: ImportMobility[];
}

export interface BuildResult {
  people: ImportPerson[];
  /** Rows that cannot be imported. */
  errors: RowIssue[];
  /** Rows imported with a value left empty. */
  warnings: RowIssue[];
}

export function buildRecords(sheet: Sheet, mapping: ColumnMapping, universities: UniversityRef[]): BuildResult {
  const errors: RowIssue[] = [];
  const warnings: RowIssue[] = [];
  const byEmail = new Map<string, ImportPerson>();
  const byName = new Map<string, ImportPerson>();
  const people: ImportPerson[] = [];

  sheet.rows.forEach((cells, i) => {
    const row = i + 2;
    const get = (field: TargetField) => {
      const index = mapping[field];
      return index === null ? '' : (cells[index] ?? '').trim();
    };

    // One "name" column may hold Arabic or English; put each name where its script belongs.
    let nameAr = get('full_name_ar') || null;
    let nameEn = get('full_name_en') || null;
    if (nameEn && hasArabic(nameEn) && !nameAr) [nameAr, nameEn] = [nameEn, null];
    if (nameAr && !hasArabic(nameAr) && !nameEn) [nameEn, nameAr] = [nameAr, null];

    const countryText = get('host_country');
    const hostCountry = parseCountry(countryText);
    const hostInstitution = get('host_institution');

    const rowErrors: RowIssue[] = [];
    if (!nameAr && !nameEn) rowErrors.push({ row, code: 'missing_name' });
    if (!hostCountry) rowErrors.push({ row, code: 'unknown_country', value: countryText });
    if (!hostInstitution) rowErrors.push({ row, code: 'missing_host_institution' });
    if (rowErrors.length) {
      errors.push(...rowErrors);
      return;
    }

    const emailText = get('email');
    const email = normalizeEmail(emailText);
    if (emailText && !email) warnings.push({ row, code: 'invalid_email', value: emailText });

    const universityText = get('home_university');
    const universityId = matchUniversity(universityText, universities);
    if (universityText && universityId === null) warnings.push({ row, code: 'unknown_university', value: universityText });

    const yearText = get('academic_year');
    const academicYear = parseAcademicYear(yearText);
    if (yearText && !academicYear) warnings.push({ row, code: 'unreadable_year', value: yearText });

    const programText = get('program');
    const program = parseProgram(programText);
    if (!program || program === 'other') warnings.push({ row, code: 'unknown_program', value: programText });

    const alumnus: ImportAlumnus = {
      full_name_en: nameEn,
      full_name_ar: nameAr,
      email,
      phone: get('phone') || null,
      gender: parseGender(get('gender')),
      home_university_id: universityId,
      field_of_study: get('field_of_study') || null,
      current_job_title: get('current_job_title') || null,
      current_organization: get('current_organization') || null,
      linkedin_url: get('linkedin_url') || null,
    };
    const mobility: ImportMobility = {
      program: program ?? 'other',
      level: parseLevel(get('level')),
      host_country: hostCountry!,
      host_institution: hostInstitution,
      academic_year: academicYear,
      start_date: parseDate(get('start_date')),
      end_date: parseDate(get('end_date')),
    };

    // Same person = same email; without an email, same name key at the same home university.
    const nameKeys = [nameKey(nameAr), nameKey(nameEn)].filter(Boolean).map((k) => `${k}|${universityId ?? ''}`);
    const person =
      (email ? byEmail.get(email) : undefined) ??
      nameKeys.map((k) => byName.get(k)).find((p) => p && (!email || !p.alumni.email));

    const target = person ?? { rows: [], alumni: alumnus, mobilities: [] };
    if (!person) people.push(target);
    target.rows.push(row);
    fillBlanks(target.alumni, alumnus);
    if (!target.mobilities.some((m) => sameMobility(m, mobility))) target.mobilities.push(mobility);
    if (email && !byEmail.has(email)) byEmail.set(email, target);
    nameKeys.forEach((k) => byName.has(k) || byName.set(k, target));
  });

  return { people, errors, warnings };
}

function fillBlanks(target: ImportAlumnus, source: ImportAlumnus) {
  for (const key of Object.keys(target) as (keyof ImportAlumnus)[]) {
    if (target[key] === null && source[key] !== null) (target as unknown as Record<string, unknown>)[key] = source[key];
  }
}

export function sameMobility(a: ImportMobility, b: ImportMobility): boolean {
  return (
    a.host_country === b.host_country &&
    a.host_institution.trim().toLowerCase() === b.host_institution.trim().toLowerCase() &&
    (a.academic_year ?? '') === (b.academic_year ?? '')
  );
}
