// Step 2 of the import: which column in their sheet holds which of our fields.
// We guess from the header text; NEO confirms or fixes the guess on screen.

import { normalizeText } from './normalize';

export const TARGET_FIELDS = [
  'full_name_ar',
  'full_name_en',
  'email',
  'phone',
  'gender',
  'home_university',
  'field_of_study',
  'host_country',
  'host_institution',
  'program',
  'level',
  'academic_year',
  'start_date',
  'end_date',
  'current_job_title',
  'current_organization',
  'linkedin_url',
] as const;

export type TargetField = (typeof TARGET_FIELDS)[number];

/** Column index in the sheet for each of our fields; null = not in the sheet. */
export type ColumnMapping = Record<TargetField, number | null>;

export const REQUIRED_FIELDS: TargetField[] = ['host_country', 'host_institution'];

const SYNONYMS: Record<TargetField, string[]> = {
  full_name_ar: ['الاسم', 'الاسم بالعربي', 'الاسم الكامل', 'اسم الطالب', 'arabic name', 'name arabic', 'name ar'],
  full_name_en: ['name', 'name english', 'english name', 'full name', 'student name', 'name en', 'الاسم بالانجليزي'],
  email: ['email', 'e mail', 'mail', 'email address', 'البريد', 'البريد الالكتروني', 'الايميل'],
  phone: ['phone', 'mobile', 'phone number', 'الهاتف', 'رقم الهاتف', 'جوال', 'الجوال', 'رقم الجوال'],
  gender: ['gender', 'sex', 'الجنس'],
  home_university: ['university', 'home university', 'home institution', 'sending institution', 'الجامعة', 'جامعة الطالب'],
  field_of_study: ['field', 'major', 'field of study', 'department', 'specialization', 'التخصص', 'القسم'],
  host_country: ['host country', 'country', 'destination', 'destination country', 'الدولة', 'الدولة المضيفة', 'البلد'],
  host_institution: ['host university', 'host institution', 'receiving institution', 'partner university', 'الجامعة المضيفة', 'الجامعة الشريكة'],
  program: ['program', 'programme', 'type', 'mobility type', 'action', 'البرنامج', 'نوع التبادل', 'نوع المنحة'],
  level: ['level', 'degree', 'study level', 'cycle', 'المرحلة', 'الدرجة', 'المستوى', 'الدرجة العلمية'],
  academic_year: ['academic year', 'year', 'العام الدراسي', 'السنة', 'السنة الدراسية'],
  start_date: ['start', 'start date', 'from', 'تاريخ البدء', 'تاريخ البداية', 'من'],
  end_date: ['end', 'end date', 'to', 'تاريخ الانتهاء', 'تاريخ النهاية', 'الى'],
  current_job_title: ['current job', 'job', 'job title', 'position', 'occupation', 'الوظيفة', 'العمل الحالي', 'الوظيفة الحالية'],
  current_organization: ['organization', 'organisation', 'employer', 'company', 'workplace', 'جهة العمل', 'الشركة', 'مكان العمل'],
  linkedin_url: ['linkedin', 'linkedin url', 'لينكد ان'],
};

/**
 * Exact header matches win first; then the longest synonym contained in a header.
 * Each field takes at most one column and each column at most one field, so "University"
 * goes to home_university while "Host University" goes to host_institution.
 */
export function guessMapping(headers: string[]): ColumnMapping {
  const mapping = Object.fromEntries(TARGET_FIELDS.map((f) => [f, null])) as ColumnMapping;
  const taken = new Set<number>();
  const normalized = headers.map((h) => normalizeText(h));

  for (const field of TARGET_FIELDS) {
    const options = SYNONYMS[field].map(normalizeText);
    const index = normalized.findIndex((h, i) => !taken.has(i) && options.includes(h));
    if (index >= 0) {
      mapping[field] = index;
      taken.add(index);
    }
  }

  const candidates: { field: TargetField; index: number; length: number }[] = [];
  for (const field of TARGET_FIELDS) {
    if (mapping[field] !== null) continue;
    for (const synonym of SYNONYMS[field].map(normalizeText)) {
      if (synonym.length < 4) continue; // "to", "من" would match too much
      normalized.forEach((h, index) => {
        if (!taken.has(index) && h.includes(synonym)) candidates.push({ field, index, length: synonym.length });
      });
    }
  }
  candidates.sort((a, b) => b.length - a.length);
  for (const c of candidates) {
    if (mapping[c.field] === null && !taken.has(c.index)) {
      mapping[c.field] = c.index;
      taken.add(c.index);
    }
  }
  return mapping;
}

export function missingRequired(mapping: ColumnMapping): TargetField[] {
  const missing = REQUIRED_FIELDS.filter((f) => mapping[f] === null);
  if (mapping.full_name_ar === null && mapping.full_name_en === null) missing.unshift('full_name_en');
  return missing;
}
