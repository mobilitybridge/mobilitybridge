import { describe, expect, it } from 'vitest';
import {
  matchUniversity,
  nameKey,
  normalizeEmail,
  normalizeText,
  parseAcademicYear,
  parseCountry,
  parseDate,
  parseGender,
  parseLevel,
  parseProgram,
} from './normalize';

describe('normalizeText', () => {
  it('unifies Arabic letter variants and strips harakat', () => {
    expect(normalizeText('إِبراهيم')).toBe(normalizeText('ابراهيم'));
    expect(normalizeText('جامعة')).toBe('جامعه');
    expect(normalizeText('مصطفى')).toBe('مصطفي');
  });
  it('strips Latin accents and punctuation', () => {
    expect(normalizeText("  Université Côte d'Azur ")).toBe('universite cote d azur');
  });
});

describe('nameKey', () => {
  it.each([
    ['Mohammad Al-Sharif', 'Muhammed Sharif'],
    ['Sara Odeh', 'Sarah Odeh'],
    ['Yousef Abu Zaid', 'Yusuf Abuzaid'],
    ['أحمد الخطيب', 'احمد خطيب'],
    ['آية أبو زيد', 'ايه ابوزيد'],
  ])('treats "%s" and "%s" as the same name', (a, b) => {
    expect(nameKey(a)).toBe(nameKey(b));
  });
  it.each([
    ['Sara Odeh', 'Salma Odeh'],
    ['Rami Issa', 'Rana Issa'],
  ])('keeps "%s" and "%s" apart', (a, b) => {
    expect(nameKey(a)).not.toBe(nameKey(b));
  });
  it('returns an empty key for an empty name', () => {
    expect(nameKey(null)).toBe('');
  });
});

describe('parseCountry', () => {
  it.each([
    ['Germany', 'DE'],
    ['germany ', 'DE'],
    ['ألمانيا', 'DE'],
    ['المانيا', 'DE'],
    ['de', 'DE'],
    ['Czech Republic', 'CZ'],
    ['Turkey', 'TR'],
  ])('%s → %s', (input, code) => expect(parseCountry(input)).toBe(code));
  it('returns null for unknown or empty values', () => {
    expect(parseCountry('Atlantis')).toBeNull();
    expect(parseCountry('')).toBeNull();
  });
});

describe('parseProgram', () => {
  it.each([
    ['Erasmus Mundus', 'erasmus_mundus'],
    ['إيراسموس موندوس', 'erasmus_mundus'],
    ['Erasmus+ KA171', 'credit_mobility'],
    ['تبادل طلابي', 'credit_mobility'],
    ['Staff training', 'staff_mobility'],
    ['تبادل موظفين', 'staff_mobility'],
    ['Something else', 'other'],
  ])('%s → %s', (input, program) => expect(parseProgram(input)).toBe(program));
});

describe('parseLevel', () => {
  it.each([
    ['BA', 'bachelor'],
    ['بكالوريوس', 'bachelor'],
    ['MSc', 'master'],
    ['ماجستير', 'master'],
    ['PhD', 'phd'],
    ['موظف', 'staff'],
  ])('%s → %s', (input, level) => expect(parseLevel(input)).toBe(level));
  it('returns null when it cannot tell', () => expect(parseLevel('year 2')).toBeNull());
});

describe('parseAcademicYear', () => {
  it.each([
    ['2023-2024', '2023/2024'],
    ['2023/24', '2023/2024'],
    ['23/24', '2023/2024'],
    ['2024', '2024/2025'],
    ['2023/2024', '2023/2024'],
  ])('%s → %s', (input, year) => expect(parseAcademicYear(input)).toBe(year));
  it('rejects years that are not consecutive', () => expect(parseAcademicYear('2023-2025')).toBeNull());
});

describe('parseDate', () => {
  it('reads ISO and day-first dates', () => {
    expect(parseDate('2024-02-15')).toBe('2024-02-15');
    expect(parseDate('15/02/2024')).toBe('2024-02-15');
  });
  it('rejects impossible dates', () => expect(parseDate('31/02/2024')).toBeNull());
});

describe('parseGender', () => {
  it('reads English and Arabic', () => {
    expect(parseGender('أنثى')).toBe('female');
    expect(parseGender('M')).toBe('male');
    expect(parseGender('')).toBeNull();
  });
});

describe('normalizeEmail', () => {
  it('lower-cases valid emails and rejects broken ones', () => {
    expect(normalizeEmail(' Sara@Example.COM ')).toBe('sara@example.com');
    expect(normalizeEmail('not an email')).toBeNull();
  });
});

describe('matchUniversity', () => {
  const universities = [
    { id: 3, name_en: 'Palestine Polytechnic University', name_ar: 'جامعة بوليتكنك فلسطين', aliases: ['PPU'] },
    { id: 4, name_en: 'Hebron University', name_ar: 'جامعة الخليل', aliases: [] },
  ];
  it.each([
    ['PPU', 3],
    ['palestine polytechnic university', 3],
    ['بوليتكنك فلسطين', 3],
    ['الخليل', 4],
    ['Unknown College', null],
  ])('%s → %s', (input, id) => expect(matchUniversity(input, universities)).toBe(id));
});
