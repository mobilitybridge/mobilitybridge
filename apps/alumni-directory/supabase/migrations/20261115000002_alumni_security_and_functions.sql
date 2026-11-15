-- Who can do what.
--   * Anyone (anon): read the universities list, and submit the alumni form via submit_alumni_form().
--     They can never read alumni data back.
--   * NEO admins (a row in public.admins): full access to everything.

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

alter table public.universities   enable row level security;
alter table public.admins         enable row level security;
alter table public.import_batches enable row level security;
alter table public.alumni         enable row level security;
alter table public.mobilities     enable row level security;

create policy universities_read_all on public.universities
  for select to anon, authenticated using (true);
create policy universities_admin_write on public.universities
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy admins_see_self on public.admins
  for select to authenticated using (user_id = auth.uid());

create policy import_batches_admin on public.import_batches
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy alumni_admin on public.alumni
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy mobilities_admin on public.mobilities
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── Public alumni form ────────────────────────────────────────────────
-- Inserts one alumnus + their mobilities in one transaction. Runs as the owner so anon
-- needs no direct insert rights. Returns nothing, so the form cannot be used to probe
-- whether an email already exists. A matching email is flagged, never overwritten.
create function public.submit_alumni_form(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_email    text := nullif(lower(trim(p ->> 'email')), '');
  v_existing uuid;
  v_id       uuid;
  m          jsonb;
begin
  if coalesce((p ->> 'consent')::boolean, false) is not true then
    raise exception 'consent is required' using errcode = '22023';
  end if;
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'a valid email is required' using errcode = '22023';
  end if;
  if jsonb_typeof(p -> 'mobilities') is distinct from 'array' or jsonb_array_length(p -> 'mobilities') = 0 then
    raise exception 'at least one mobility is required' using errcode = '22023';
  end if;

  select id into v_existing from public.alumni
   where lower(email) = v_email order by created_at limit 1;

  insert into public.alumni (
    full_name_en, full_name_ar, email, phone, gender, home_university_id, field_of_study,
    current_job_title, current_organization, current_country, linkedin_url, story,
    consent_given_at, visibility, source, possible_duplicate_of
  ) values (
    nullif(trim(p ->> 'full_name_en'), ''), nullif(trim(p ->> 'full_name_ar'), ''), v_email,
    nullif(trim(p ->> 'phone'), ''), nullif(p ->> 'gender', ''), (p ->> 'home_university_id')::int,
    nullif(trim(p ->> 'field_of_study'), ''), nullif(trim(p ->> 'current_job_title'), ''),
    nullif(trim(p ->> 'current_organization'), ''), nullif(upper(p ->> 'current_country'), ''),
    nullif(trim(p ->> 'linkedin_url'), ''), nullif(trim(p ->> 'story'), ''),
    now(), coalesce(nullif(p ->> 'visibility', ''), 'neo_only'), 'self', v_existing
  ) returning id into v_id;

  for m in select * from jsonb_array_elements(p -> 'mobilities') loop
    insert into public.mobilities (alumni_id, program, level, host_country, host_institution,
                                   academic_year, start_date, end_date)
    values (v_id, m ->> 'program', nullif(m ->> 'level', ''), upper(m ->> 'host_country'),
            trim(m ->> 'host_institution'), nullif(m ->> 'academic_year', ''),
            (nullif(m ->> 'start_date', ''))::date, (nullif(m ->> 'end_date', ''))::date);
  end loop;
end;
$$;

-- ── Excel/CSV import (admins only) ────────────────────────────────────
-- The import wizard has already mapped columns and resolved duplicates. Each record:
--   { "action": "insert" | "merge" | "skip",
--     "merge_into": uuid,              -- for merge: the existing alumnus
--     "possible_duplicate_of": uuid,   -- for insert: flag for NEO to review later
--     "alumni": { ...alumni columns... },
--     "mobilities": [ { ...mobility columns... } ] }
-- A merge only fills fields that are empty on the existing record, and only adds
-- mobilities that are not already there. All of it is one transaction.
create function public.import_alumni_batch(p_file_name text, p_records jsonb) returns jsonb
language plpgsql security invoker set search_path = public as $$
declare
  v_batch    int;
  r          jsonb;
  a          jsonb;
  m          jsonb;
  v_id       uuid;
  v_inserted int := 0;
  v_merged   int := 0;
  v_skipped  int := 0;
  v_mobs     int := 0;
begin
  if not public.is_admin() then
    raise exception 'only NEO admins can import' using errcode = '42501';
  end if;

  insert into public.import_batches (file_name, row_count, imported_by)
  values (p_file_name, jsonb_array_length(p_records), auth.uid())
  returning id into v_batch;

  for r in select * from jsonb_array_elements(p_records) loop
    a := r -> 'alumni';

    if r ->> 'action' = 'skip' then
      v_skipped := v_skipped + 1;
      continue;
    elsif r ->> 'action' = 'merge' then
      v_id := (r ->> 'merge_into')::uuid;
      update public.alumni set
        full_name_en         = coalesce(full_name_en, nullif(a ->> 'full_name_en', '')),
        full_name_ar         = coalesce(full_name_ar, nullif(a ->> 'full_name_ar', '')),
        email                = coalesce(email, nullif(lower(a ->> 'email'), '')),
        phone                = coalesce(phone, nullif(a ->> 'phone', '')),
        gender               = coalesce(gender, nullif(a ->> 'gender', '')),
        home_university_id   = coalesce(home_university_id, (a ->> 'home_university_id')::int),
        field_of_study       = coalesce(field_of_study, nullif(a ->> 'field_of_study', '')),
        current_job_title    = coalesce(current_job_title, nullif(a ->> 'current_job_title', '')),
        current_organization = coalesce(current_organization, nullif(a ->> 'current_organization', '')),
        current_country      = coalesce(current_country, nullif(upper(a ->> 'current_country'), '')),
        linkedin_url         = coalesce(linkedin_url, nullif(a ->> 'linkedin_url', ''))
      where id = v_id;
      if not found then
        raise exception 'merge target % does not exist', v_id using errcode = '23503';
      end if;
      v_merged := v_merged + 1;
    elsif r ->> 'action' = 'insert' then
      insert into public.alumni (
        full_name_en, full_name_ar, email, phone, gender, home_university_id, field_of_study,
        current_job_title, current_organization, current_country, linkedin_url,
        source, import_batch_id, possible_duplicate_of
      ) values (
        nullif(a ->> 'full_name_en', ''), nullif(a ->> 'full_name_ar', ''), nullif(lower(a ->> 'email'), ''),
        nullif(a ->> 'phone', ''), nullif(a ->> 'gender', ''), (a ->> 'home_university_id')::int,
        nullif(a ->> 'field_of_study', ''), nullif(a ->> 'current_job_title', ''),
        nullif(a ->> 'current_organization', ''), nullif(upper(a ->> 'current_country'), ''),
        nullif(a ->> 'linkedin_url', ''), 'import', v_batch, (r ->> 'possible_duplicate_of')::uuid
      ) returning id into v_id;
      v_inserted := v_inserted + 1;
    else
      raise exception 'unknown action %', r ->> 'action' using errcode = '22023';
    end if;

    for m in select * from jsonb_array_elements(coalesce(r -> 'mobilities', '[]'::jsonb)) loop
      if not exists (
        select 1 from public.mobilities x
         where x.alumni_id = v_id
           and x.host_country = upper(m ->> 'host_country')
           and lower(x.host_institution) = lower(trim(m ->> 'host_institution'))
           and coalesce(x.academic_year, '') = coalesce(m ->> 'academic_year', '')
      ) then
        insert into public.mobilities (alumni_id, program, level, host_country, host_institution,
                                       academic_year, start_date, end_date)
        values (v_id, coalesce(nullif(m ->> 'program', ''), 'other'), nullif(m ->> 'level', ''),
                upper(m ->> 'host_country'), trim(m ->> 'host_institution'),
                nullif(m ->> 'academic_year', ''),
                (nullif(m ->> 'start_date', ''))::date, (nullif(m ->> 'end_date', ''))::date);
        v_mobs := v_mobs + 1;
      end if;
    end loop;
  end loop;

  return jsonb_build_object('batch_id', v_batch, 'inserted', v_inserted, 'merged', v_merged,
                            'skipped', v_skipped, 'mobilities_added', v_mobs);
end;
$$;

revoke all on function public.submit_alumni_form(jsonb) from public;
revoke all on function public.import_alumni_batch(text, jsonb) from public;
grant execute on function public.submit_alumni_form(jsonb) to anon, authenticated;
grant execute on function public.import_alumni_batch(text, jsonb) to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
