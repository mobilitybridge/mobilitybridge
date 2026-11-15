-- Database behaviour tests. Run with: npm run test:db (see README).
-- Each block raises an exception on failure, which stops the run.
\set ON_ERROR_STOP on

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000a001', 'admin@neo.test'),
  ('00000000-0000-0000-0000-00000000b001', 'random.user@test.test');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-00000000a001');
insert into public.universities (name_en, name_ar, city) values ('Test University', 'جامعة الاختبار', 'Hebron');

-- ── As anonymous visitor ──────────────────────────────────────────────
set role anon;
select set_config('request.jwt.claim.sub', '', false);

do $$ begin
  if (select count(*) from public.universities) = 0 then
    raise exception 'FAIL: anon should read universities';
  end if;
end $$;

do $$ begin
  perform public.submit_alumni_form('{"full_name_en":"No Consent","email":"a@x.test","consent":false,
    "mobilities":[{"program":"credit_mobility","host_country":"RO","host_institution":"U"}]}');
  raise exception 'FAIL: form without consent was accepted';
exception when sqlstate '22023' then null;
end $$;

do $$ begin
  perform public.submit_alumni_form('{"full_name_en":"No Mobility","email":"b@x.test","consent":true,"mobilities":[]}');
  raise exception 'FAIL: form without a mobility was accepted';
exception when sqlstate '22023' then null;
end $$;

select public.submit_alumni_form(jsonb_build_object(
  'full_name_en', 'Sara Test', 'full_name_ar', 'سارة اختبار', 'email', 'Sara@Example.test', 'consent', true,
  'home_university_id', (select id from public.universities limit 1), 'visibility', 'alumni',
  'mobilities', '[{"program":"credit_mobility","level":"bachelor","host_country":"ro","host_institution":"Dunarea de Jos University of Galati","academic_year":"2023/2024"},
                  {"program":"erasmus_mundus","level":"master","host_country":"ES","host_institution":"University of Granada","academic_year":"2025/2026"}]'::jsonb));
select public.submit_alumni_form('{"full_name_en":"Sara Again","email":"sara@example.test","consent":true,
  "mobilities":[{"program":"credit_mobility","host_country":"RO","host_institution":"U"}]}');

do $$ begin
  if (select count(*) from public.alumni) <> 0 then
    raise exception 'FAIL: anon must not read alumni';
  end if;
end $$;

do $$ begin
  perform public.import_alumni_batch('x.xlsx', '[]');
  raise exception 'FAIL: anon was allowed to import';
exception when insufficient_privilege then null;
end $$;

-- ── As a logged-in user who is NOT a NEO admin ────────────────────────
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000b001', false);

do $$ begin
  if (select count(*) from public.alumni) <> 0 then
    raise exception 'FAIL: non-admin must not read alumni';
  end if;
  if public.is_admin() then
    raise exception 'FAIL: non-admin reported as admin';
  end if;
end $$;

do $$ begin
  perform public.import_alumni_batch('x.xlsx', '[]');
  raise exception 'FAIL: non-admin was allowed to import';
exception when insufficient_privilege then null;
end $$;

-- ── As a NEO admin ────────────────────────────────────────────────────
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000a001', false);

do $$
declare
  first_sara uuid;
begin
  if not public.is_admin() then raise exception 'FAIL: admin not recognised'; end if;

  select id into first_sara from public.alumni where full_name_en = 'Sara Test';
  if first_sara is null then raise exception 'FAIL: form submission not stored'; end if;
  if (select count(*) from public.mobilities where alumni_id = first_sara) <> 2 then
    raise exception 'FAIL: expected 2 mobilities for Sara';
  end if;
  if (select host_country from public.mobilities where alumni_id = first_sara and level = 'bachelor') <> 'RO' then
    raise exception 'FAIL: host country not upper-cased';
  end if;
  if (select consent_given_at is null or source <> 'self' or email <> 'sara@example.test'
        from public.alumni where id = first_sara) then
    raise exception 'FAIL: consent/source/email not set correctly';
  end if;
  if (select possible_duplicate_of from public.alumni where full_name_en = 'Sara Again') is distinct from first_sara then
    raise exception 'FAIL: same email (different case) should be flagged as a possible duplicate';
  end if;
end $$;

do $$
declare
  sara   uuid := (select id from public.alumni where full_name_en = 'Sara Test');
  result jsonb;
begin
  result := public.import_alumni_batch('neo_sheet.xlsx', jsonb_build_array(
    jsonb_build_object('action', 'insert',
      'alumni', jsonb_build_object('full_name_ar', 'محمد اختبار', 'email', 'MOHAMMAD@x.test'),
      'mobilities', '[{"program":"credit_mobility","host_country":"de","host_institution":"TU Test","academic_year":"2022/2023"}]'::jsonb),
    jsonb_build_object('action', 'insert', 'possible_duplicate_of', sara,
      'alumni', jsonb_build_object('full_name_en', 'Sarah Test'),
      'mobilities', '[]'::jsonb),
    jsonb_build_object('action', 'merge', 'merge_into', sara,
      'alumni', jsonb_build_object('full_name_en', 'SHOULD NOT OVERWRITE', 'phone', '0590000000'),
      'mobilities', '[{"program":"credit_mobility","host_country":"RO","host_institution":"dunarea de jos university of galati","academic_year":"2023/2024"},
                      {"program":"staff_mobility","host_country":"IT","host_institution":"Universita di Test","academic_year":"2026/2027"}]'::jsonb),
    jsonb_build_object('action', 'skip', 'alumni', '{}'::jsonb)));

  if result <> jsonb_build_object('batch_id', result -> 'batch_id', 'inserted', 2, 'merged', 1,
                                  'skipped', 1, 'mobilities_added', 2) then
    raise exception 'FAIL: unexpected import result %', result;
  end if;
  if (select full_name_en from public.alumni where id = sara) <> 'Sara Test' then
    raise exception 'FAIL: merge overwrote an existing value';
  end if;
  if (select phone from public.alumni where id = sara) <> '0590000000' then
    raise exception 'FAIL: merge did not fill an empty value';
  end if;
  if (select count(*) from public.mobilities where alumni_id = sara) <> 3 then
    raise exception 'FAIL: merge should add only the new mobility (expected 3)';
  end if;
  if (select email from public.alumni where full_name_ar = 'محمد اختبار') <> 'mohammad@x.test' then
    raise exception 'FAIL: imported email not lower-cased';
  end if;
  if (select visibility from public.alumni where full_name_ar = 'محمد اختبار') <> 'neo_only' then
    raise exception 'FAIL: imported records must stay NEO-only';
  end if;
  if (select imported_by from public.import_batches where id = (result ->> 'batch_id')::int)
       <> '00000000-0000-0000-0000-00000000a001' then
    raise exception 'FAIL: batch should record who imported it';
  end if;
end $$;

do $$ begin
  insert into public.alumni (full_name_en, source, visibility) values ('No consent public', 'import', 'public');
  raise exception 'FAIL: a record without consent was made public';
exception when check_violation then null;
end $$;

reset role;
\echo 'ALL DATABASE TESTS PASSED'
