// Step 4 of the import: compare each person in the sheet with who is already in the directory.
//   same email                          → the same person: default MERGE (fill blanks, add new trips)
//   same name key + same home university → POSSIBLE duplicate: default INSERT, flagged for NEO
//   nothing in common                   → new person: INSERT
// NEO can change any default before saving. Nothing is ever merged without that screen.

import type { ImportPerson } from './buildRecords';
import { nameKey } from './normalize';

export interface ExistingAlumnus {
  id: string;
  full_name_en: string | null;
  full_name_ar: string | null;
  email: string | null;
  home_university_id: number | null;
}

export type Match = { kind: 'email' | 'name'; existing: ExistingAlumnus };
export type Action = 'insert' | 'merge' | 'skip';

export interface Decision {
  person: ImportPerson;
  match: Match | null;
  action: Action;
}

export function findMatches(people: ImportPerson[], existing: ExistingAlumnus[]): Decision[] {
  const byEmail = new Map<string, ExistingAlumnus>();
  const byName = new Map<string, ExistingAlumnus>();
  for (const e of existing) {
    if (e.email) byEmail.set(e.email.toLowerCase(), e);
    if (e.home_university_id === null) continue;
    for (const key of [nameKey(e.full_name_ar), nameKey(e.full_name_en)]) {
      if (key && !byName.has(`${key}|${e.home_university_id}`)) byName.set(`${key}|${e.home_university_id}`, e);
    }
  }

  return people.map((person) => {
    const { email, full_name_ar, full_name_en, home_university_id } = person.alumni;
    const emailMatch = email ? byEmail.get(email) : undefined;
    if (emailMatch) return { person, match: { kind: 'email', existing: emailMatch }, action: 'merge' };

    if (home_university_id !== null) {
      const nameMatch = [nameKey(full_name_ar), nameKey(full_name_en)]
        .filter(Boolean)
        .map((k) => byName.get(`${k}|${home_university_id}`))
        .find(Boolean);
      // A different email on both sides means two different people who share a name.
      if (nameMatch && !(email && nameMatch.email && nameMatch.email.toLowerCase() !== email)) {
        return { person, match: { kind: 'name', existing: nameMatch }, action: 'insert' };
      }
    }
    return { person, match: null, action: 'insert' };
  });
}

/** The payload public.import_alumni_batch() expects. */
export function toImportPayload(decisions: Decision[]) {
  return decisions.map(({ person, match, action }) => ({
    action,
    merge_into: action === 'merge' ? match?.existing.id ?? null : null,
    possible_duplicate_of: action === 'insert' && match ? match.existing.id : null,
    alumni: person.alumni,
    mobilities: person.mobilities,
  }));
}

export function summarize(decisions: Decision[]) {
  return {
    total: decisions.length,
    newPeople: decisions.filter((d) => !d.match).length,
    sameEmail: decisions.filter((d) => d.match?.kind === 'email').length,
    possibleDuplicates: decisions.filter((d) => d.match?.kind === 'name').length,
  };
}
