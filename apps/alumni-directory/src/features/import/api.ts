import { supabase } from '../../lib/supabase';
import type { Decision, ExistingAlumnus } from './dedupe';
import { toImportPayload } from './dedupe';
import type { UniversityRef } from './normalize';

export async function fetchUniversities(): Promise<UniversityRef[]> {
  const { data, error } = await supabase.from('universities').select('id, name_en, name_ar, aliases').order('name_en');
  if (error) throw error;
  return data;
}

/** Everyone already in the directory, fetched in pages (Supabase returns at most 1000 rows per request). */
export async function fetchExistingAlumni(): Promise<ExistingAlumnus[]> {
  const pageSize = 1000;
  const all: ExistingAlumnus[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('alumni')
      .select('id, full_name_en, full_name_ar, email, home_university_id')
      .order('created_at')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    all.push(...data);
    if (data.length < pageSize) return all;
  }
}

export interface ImportResult {
  batch_id: number;
  inserted: number;
  merged: number;
  skipped: number;
  mobilities_added: number;
}

export async function runImport(fileName: string, decisions: Decision[]): Promise<ImportResult> {
  const { data, error } = await supabase.rpc('import_alumni_batch', {
    p_file_name: fileName,
    p_records: toImportPayload(decisions),
  });
  if (error) throw error;
  return data as ImportResult;
}
