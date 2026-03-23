-- =============================================================================
-- Marley UDel Planner – Supabase Schema
-- =============================================================================
-- Run this file against your Supabase project via the SQL Editor or the CLI:
--   supabase db push  (if using local dev)
--   or paste into Supabase Dashboard > SQL Editor
-- =============================================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- =============================================================================
-- REFERENCE / SEED TABLES
-- These are populated from the application's static data files and are
-- publicly readable so the client can query them without auth.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- courses
-- ---------------------------------------------------------------------------
create table if not exists courses (
  id            text        primary key,           -- e.g. "bisc-104"
  school        text        not null check (school in ('udel', 'brookdale')),
  course_code   text        not null,              -- e.g. "BISC 104"
  title         text        not null,
  credits       numeric(4,1) not null default 3,
  description   text,
  attributes    text[],                            -- e.g. ARRAY['DLE', 'CAS']
  prerequisites text,
  typically_offered text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table courses is 'Master course catalogue for UDel and Brookdale courses.';

-- ---------------------------------------------------------------------------
-- transfer_mappings
-- ---------------------------------------------------------------------------
create table if not exists transfer_mappings (
  id                  text        primary key,      -- e.g. "tm-1"
  brookdale_courses   text[]      not null,         -- e.g. ARRAY['ACCT 101']
  brookdale_titles    text[]      not null,
  udel_course_code    text        not null,
  udel_title          text        not null,
  notes               text,
  last_reviewed       integer,                      -- academic year, e.g. 2024
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table transfer_mappings is 'Brookdale CC → UDel course articulation table.';

-- ---------------------------------------------------------------------------
-- requirements
-- ---------------------------------------------------------------------------
create table if not exists requirements (
  id                text        primary key,        -- e.g. "major-core-stats"
  category          text        not null check (
                      category in ('university', 'college', 'major_core', 'ppslp', 'elective')
                    ),
  subcategory       text,
  name              text        not null,
  description       text,
  credits_required  integer     not null default 3,
  fulfillment_type  text        not null check (
                      fulfillment_type in ('all', 'any', 'credits')
                    ),
  parent_id         text        references requirements(id) on delete set null,
  sort_order        integer     not null default 0,
  is_required       boolean     not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table requirements is 'Degree requirements for the CGSC-BS / PPSLP program.';

-- ---------------------------------------------------------------------------
-- requirement_courses  (junction: which course codes satisfy a requirement)
-- ---------------------------------------------------------------------------
create table if not exists requirement_courses (
  requirement_id  text  not null references requirements(id) on delete cascade,
  course_code     text  not null,                   -- UDel course code
  primary key (requirement_id, course_code)
);

comment on table requirement_courses is 'Maps UDel course codes to the requirements they satisfy.';

-- =============================================================================
-- PLAN TABLES
-- These are user-generated content and require service-role writes.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- plans
-- ---------------------------------------------------------------------------
create table if not exists plans (
  id                  uuid        primary key default gen_random_uuid(),
  name                text        not null,
  description         text,
  slug                text        not null unique,
  target_graduation   text        not null,         -- e.g. "Spring 2028"
  is_early_graduation boolean     not null default false,
  pin_hash            text,                         -- bcrypt hash of user PIN (nullable = no PIN)
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table plans is 'User-created degree plans. Identified publicly by slug.';
comment on column plans.pin_hash is 'bcrypt hash of optional PIN set by the plan owner.';

-- ---------------------------------------------------------------------------
-- plan_semesters
-- ---------------------------------------------------------------------------
create table if not exists plan_semesters (
  id          uuid        primary key default gen_random_uuid(),
  plan_id     uuid        not null references plans(id) on delete cascade,
  term        text        not null check (term in ('Fall', 'Winter', 'Spring', 'Summer')),
  year        integer     not null,
  school      text        not null check (school in ('udel', 'brookdale')),
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now()
);

comment on table plan_semesters is 'Semesters within a plan.';

create index if not exists plan_semesters_plan_id_idx on plan_semesters(plan_id);

-- ---------------------------------------------------------------------------
-- plan_courses
-- ---------------------------------------------------------------------------
create table if not exists plan_courses (
  id                      uuid        primary key default gen_random_uuid(),
  plan_semester_id        uuid        not null references plan_semesters(id) on delete cascade,
  course_code             text        not null,
  title                   text        not null,
  school                  text        not null check (school in ('udel', 'brookdale')),
  credits                 numeric(4,1) not null default 3,
  status                  text        not null check (
                            status in ('completed', 'in_progress', 'planned', 'transfer')
                          ),
  grade                   text,
  fulfills_requirement_id text        references requirements(id) on delete set null,
  notes                   text,
  created_at              timestamptz not null default now()
);

comment on table plan_courses is 'Individual courses within a plan semester.';

create index if not exists plan_courses_semester_id_idx on plan_courses(plan_semester_id);

-- =============================================================================
-- updated_at TRIGGERS
-- =============================================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger courses_updated_at
  before update on courses
  for each row execute procedure set_updated_at();

create or replace trigger transfer_mappings_updated_at
  before update on transfer_mappings
  for each row execute procedure set_updated_at();

create or replace trigger requirements_updated_at
  before update on requirements
  for each row execute procedure set_updated_at();

create or replace trigger plans_updated_at
  before update on plans
  for each row execute procedure set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
alter table courses              enable row level security;
alter table transfer_mappings    enable row level security;
alter table requirements         enable row level security;
alter table requirement_courses  enable row level security;
alter table plans                enable row level security;
alter table plan_semesters       enable row level security;
alter table plan_courses         enable row level security;

-- ---------------------------------------------------------------------------
-- Reference tables: publicly readable, not writable via anon/authenticated
-- ---------------------------------------------------------------------------

create policy "Public read: courses"
  on courses for select
  using (true);

create policy "Public read: transfer_mappings"
  on transfer_mappings for select
  using (true);

create policy "Public read: requirements"
  on requirements for select
  using (true);

create policy "Public read: requirement_courses"
  on requirement_courses for select
  using (true);

-- ---------------------------------------------------------------------------
-- Plans: publicly readable (needed for shareable plan links)
-- Writes are service-role only (API route uses admin client)
-- ---------------------------------------------------------------------------

create policy "Public read: plans"
  on plans for select
  using (true);

create policy "Public read: plan_semesters"
  on plan_semesters for select
  using (true);

create policy "Public read: plan_courses"
  on plan_courses for select
  using (true);

-- Service-role bypass: Supabase service role key automatically bypasses RLS.
-- The API routes in this project use the service role client exclusively for
-- write operations, so no additional INSERT/UPDATE/DELETE policies are needed
-- for the anon role.

-- =============================================================================
-- OPTIONAL: seed reference data from static TS files
-- =============================================================================
-- You can seed this database by running the seed script:
--   npx ts-node scripts/seed-supabase.ts
-- or by inserting rows manually matching the data in:
--   src/lib/data/courses.ts
--   src/lib/data/transfer-mappings.ts
--   src/lib/data/requirements.ts
-- =============================================================================
