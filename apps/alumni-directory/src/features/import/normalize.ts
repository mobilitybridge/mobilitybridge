// Turning the free-text values found in office spreadsheets into clean, comparable values.
// Everything here is pure (no I/O), so it is covered by unit tests.

import { COUNTRIES } from './countries';

const ARABIC_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g; // harakat, small marks, tatweel
const LATIN_MARKS = /[̀-ͯ]/g;
const ARABIC_LETTER = /[؀-ۿ]/;

/** Lower-case, accent-free, Arabic letter variants unified, punctuation turned into single spaces. */
export function normalizeText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(LATIN_MARKS, '')
    .replace(ARABIC_MARKS, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function hasArabic(value: string): boolean {
  return ARABIC_LETTER.test(value);
}

/**
 * A loose "sounds like the same name" key, used only to FLAG possible duplicates for a human.
 *  - Arabic: unified letters, the article "ال" dropped, spaces removed ("أبو زيد" = "ابوزيد").
 *  - Latin: "al"/"el" dropped, then each word keeps its first letter plus its consonants, with a final
 *    "h" and doubled letters removed, so Mohammad = Muhammed and Sara = Sarah.
 */
export function nameKey(name: string | null | undefined): string {
  if (!name) return '';
  const words = normalizeText(name).split(' ').filter(Boolean);
  if (hasArabic(name)) {
    return words.map((w) => (w.length > 4 && w.startsWith('ال') ? w.slice(2) : w)).join('');
  }
  return words
    .filter((w) => w !== 'al' && w !== 'el')
    .map((w) => {
      const noFinalH = w.length > 2 ? w.replace(/h$/, '') : w;
      const skeleton = noFinalH[0] + noFinalH.slice(1).replace(/[aeiouy]/g, '');
      return skeleton.replace(/(.)\1+/g, '$1');
    })
    .join('');
}

export function normalizeEmail(value: string | null | undefined): string | null {
  const email = value?.trim().toLowerCase() ?? '';
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : null;
}

const COUNTRY_LOOKUP = new Map<string, string>();
for (const c of COUNTRIES) {
  for (const spelling of [c.code, c.en, c.ar, ...c.aliases]) {
    COUNTRY_LOOKUP.set(normalizeText(spelling), c.code);
  }
}

/** "Germany", "germany ", "ألمانيا", "DE" → "DE". Unknown → null. */
export function parseCountry(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  return COUNTRY_LOOKUP.get(normalizeText(value)) ?? null;
}

export type Program = 'credit_mobility' | 'erasmus_mundus' | 'staff_mobility' | 'other';

/** Keyword match. Order matters: "Erasmus Mundus" must not fall into the generic "erasmus" bucket. */
export function parseProgram(value: string | null | undefined): Program | null {
  const v = normalizeText(value ?? '');
  if (!v) return null;
  if (/mundus|emjm|موندوس/.test(v)) return 'erasmus_mundus';
  if (/staff|teaching|training|موظف|اكاديمي|تدريس/.test(v)) return 'staff_mobility';
  if (/ka ?171|ka ?107|credit|exchange|icm|erasmus|تبادل|طلابي|ايراسموس/.test(v)) return 'credit_mobility';
  return 'other';
}

export type Level = 'bachelor' | 'master' | 'phd' | 'staff';

export function parseLevel(value: string | null | undefined): Level | null {
  const v = normalizeText(value ?? '');
  if (!v) return null;
  if (/^(ba|bsc|bs|b a)$|bachelor|undergrad|بكالوريوس|بكالوريس/.test(v)) return 'bachelor';
  if (/^(ma|msc|ms|m a|mba)$|master|ماجستير|ماجيستير/.test(v)) return 'master';
  if (/phd|doctor|دكتوراه|دكتوراة/.test(v)) return 'phd';
  if (/staff|موظف|اكاديمي/.test(v)) return 'staff';
  return null;
}

/**
 * "2023-2024", "2023/24", "23/24" → "2023/2024".
 * ASSUMPTION: a single year ("2024") is the year the academic year starts.
 */
export function parseAcademicYear(value: string | null | undefined): string | null {
  const v = (value ?? '').trim();
  let m = v.match(/^(\d{4})\s*[-/–]\s*(\d{2}|\d{4})$/);
  if (m) {
    const start = Number(m[1]);
    const end = m[2].length === 2 ? Math.floor(start / 100) * 100 + Number(m[2]) : Number(m[2]);
    return end === start + 1 ? `${start}/${end}` : null;
  }
  m = v.match(/^(\d{2})\s*[-/–]\s*(\d{2})$/);
  if (m && Number(m[2]) === Number(m[1]) + 1) return `20${m[1]}/20${m[2]}`;
  m = v.match(/^(\d{4})$/);
  if (m) return `${m[1]}/${Number(m[1]) + 1}`;
  return null;
}

/**
 * Accepts ISO dates (2024-02-15) and day-first dates (15/02/2024).
 * ASSUMPTION: slash dates in NEO sheets are day/month/year, the local convention.
 */
export function parseDate(value: string | null | undefined): string | null {
  const v = (value ?? '').trim();
  let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) {
    const d = v.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
    if (d) m = [d[0], d[3], d[2], d[1]];
  }
  if (!m) return null;
  const [y, mo, da] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, da));
  if (date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== da) return null;
  return date.toISOString().slice(0, 10);
}

export function parseGender(value: string | null | undefined): 'female' | 'male' | null {
  const v = normalizeText(value ?? '');
  if (/^(f|female|woman|انثي|اناث)$/.test(v)) return 'female'; // "أنثى" normalizes to "انثي"
  if (/^(m|male|man|ذكر|ذكور)$/.test(v)) return 'male';
  return null;
}

export interface UniversityRef {
  id: number;
  name_en: string;
  name_ar: string | null;
  aliases: string[];
}

/** Matches "PPU", "بوليتكنك فلسطين" or the full name against the universities table. */
export function matchUniversity(value: string | null | undefined, universities: UniversityRef[]): number | null {
  const v = normalizeText(value ?? '');
  if (!v) return null;
  const strip = (s: string) => normalizeText(s).replace(/^(جامعه|الجامعه)\s+/, '');
  for (const u of universities) {
    const spellings = [u.name_en, u.name_ar ?? '', ...u.aliases].filter(Boolean);
    if (spellings.some((s) => normalizeText(s) === v || strip(s) === strip(v))) return u.id;
  }
  return null;
}
