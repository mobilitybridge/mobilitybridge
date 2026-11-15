-- Alumni directory (NEO demo) schema. Decision record: docs/adr/0004-alumni-directory-demo-stack.md
--
-- Key idea: one alumnus can have MANY mobilities (e.g. a bachelor exchange, then an
-- Erasmus Mundus master), so mobilities live in their own table linked by alumni_id.
-- Countries are ISO 3166-1 alpha-2 codes ('RO', 'DE'); the UI shows the names.

create table public.universities (
  id         serial primary key,
  name_en    text not null unique,
  name_ar    text,
  city       text,
  -- Other spellings found in NEO sheets ('PPU', 'بوليتكنك فلسطين'); used by the import to match names.
  aliases    text[] not null default '{}'
);

-- Who counts as a NEO admin. Add a row after creating the user in Supabase Auth.
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.import_batches (
  id          serial primary key,
  file_name   text not null,
  row_count   int not null default 0,
  imported_by uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table public.alumni (
  id                    uuid primary key default gen_random_uuid(),
  full_name_en          text,
  full_name_ar          text,
  email                 text,
  phone                 text,
  gender                text check (gender in ('female', 'male')),
  home_university_id    int references public.universities (id) on delete set null,
  field_of_study        text,
  current_job_title     text,
  current_organization  text,
  current_country       char(2) check (current_country ~ '^[A-Z]{2}$'),
  linkedin_url          text,
  story                 text,
  -- null = no consent: the record stays NEO-only and is never shown to anyone else.
  consent_given_at      timestamptz,
  visibility            text not null default 'neo_only'
                          check (visibility in ('neo_only', 'alumni', 'public')),
  source                text not null check (source in ('self', 'import')),
  import_batch_id       int references public.import_batches (id) on delete set null,
  -- Duplicates are flagged for NEO to decide, never merged automatically.
  possible_duplicate_of uuid references public.alumni (id) on delete set null,
  verified              boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint alumni_has_a_name check (full_name_en is not null or full_name_ar is not null),
  constraint alumni_visible_only_with_consent check (visibility = 'neo_only' or consent_given_at is not null)
);

create index alumni_email_idx on public.alumni (lower(email));
create index alumni_home_university_idx on public.alumni (home_university_id);

create table public.mobilities (
  id               serial primary key,
  alumni_id        uuid not null references public.alumni (id) on delete cascade,
  program          text not null
                     check (program in ('credit_mobility', 'erasmus_mundus', 'staff_mobility', 'other')),
  level            text check (level in ('bachelor', 'master', 'phd', 'staff')),
  host_country     char(2) not null check (host_country ~ '^[A-Z]{2}$'),
  host_institution text not null,
  academic_year    text check (academic_year ~ '^\d{4}/\d{4}$'),
  start_date       date,
  end_date         date,
  constraint mobility_dates_in_order check (end_date is null or start_date is null or end_date >= start_date)
);

create index mobilities_alumni_idx on public.mobilities (alumni_id);
create index mobilities_host_country_idx on public.mobilities (host_country);

create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger alumni_touch_updated_at
  before update on public.alumni
  for each row execute function public.touch_updated_at();
