import { describe, expect, it } from 'vitest';
import { TARGET_FIELDS } from '../features/import/columns';
import ar from './ar.json';
import en from './en.json';

type Tree = { [key: string]: string | Tree };
const keys = (tree: Tree, prefix = ''): string[] =>
  Object.entries(tree).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`.replace(/_(zero|one|two|few|many|other)$/, '')] : keys(v, `${prefix}${k}.`),
  );

describe('locales', () => {
  it('Arabic and English have the same keys (plural forms aside)', () => {
    expect([...new Set(keys(ar))].sort()).toEqual([...new Set(keys(en))].sort());
  });
  it('every import field has a label in both languages', () => {
    for (const field of TARGET_FIELDS) {
      expect(ar.fields[field]).toBeTruthy();
      expect(en.fields[field]).toBeTruthy();
    }
  });
});
