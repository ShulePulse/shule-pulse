-- =====================================================================
-- ShulePulse - 001_init.sql
-- Schema + indexes + helper functions + triggers + RLS policies.
-- Run once in the Supabase SQL Editor (or `supabase db push`).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------------------

create table public.schools (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  region      text not null,
  created_at  timestamptz not null default now()
);

create table public.academic_terms (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools(id) on delete cascade,
  name        text not null,
  year        int  not null,
  start_date  date not null,
  end_date    date not null,
  check (end_date >= start_date)
);

-- Profile row for every auth user (id = auth.users.id)
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  school_id   uuid references public.schools(id) on delete set null,  -- null for super_admin
  role        text not null default 'parent'
              check (role in ('parent', 'teacher', 'admin', 'super_admin')),
  full_name   text not null default '',
  phone       text,
  email       text,
  created_at  timestamptz not null default now()
);

create table public.students (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references public.schools(id) on delete cascade,
  full_name     text not null,
  admission_no  text not null,
  class_name    text not null,               -- e.g. "Form 1"
  stream        text,                        -- e.g. "A"
  created_at    timestamptz not null default now(),
  unique (school_id, admission_no)
);

create table public.parent_student_links (
  id             uuid primary key default gen_random_uuid(),
  parent_id      uuid not null references public.users(id) on delete cascade,
  student_id     uuid not null references public.students(id) on delete cascade,
  relationship   text not null check (relationship in ('Mother', 'Father', 'Guardian')),
  consent_given  boolean not null default false,   -- PDPA
  consent_date   timestamptz,
  unique (parent_id, student_id)
);

create table public.attendance (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students(id) on delete cascade,
  teacher_id  uuid references public.users(id) on delete set null,
  date        date not null,
  status      text not null check (status in ('present', 'absent', 'late')),
  notes       text,
  created_at  timestamptz not null default now(),
  unique (student_id, date)
);

create table public.behavior_logs (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students(id) on delete cascade,
  teacher_id  uuid references public.users(id) on delete set null,
  tag         text not null,   -- 'Amechelewa' | 'Kazi haijafanywa' | 'Uongozi bora' | 'Kuvuruga'
  severity    text not null check (severity in ('positive', 'neutral', 'negative')),
  notes       text,
  created_at  timestamptz not null default now()
);

create table public.grades (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references public.students(id) on delete cascade,
  term_id          uuid not null references public.academic_terms(id) on delete cascade,
  subject          text not null,
  assessment_name  text not null,
  score            numeric not null check (score >= 0),
  max_score        numeric not null default 100 check (max_score > 0),
  teacher_id       uuid references public.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  check (score <= max_score)
);

-- NOTE: school_id, student_id and error are additions to the blueprint so that
-- RLS can scope SMS logs to a school and failures can be diagnosed.
create table public.sms_logs (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid references public.schools(id) on delete cascade,
  student_id       uuid references public.students(id) on delete set null,
  recipient_phone  text not null,
  message          text not null,
  status           text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  error            text,
  sent_at          timestamptz,
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. INDEXES
-- ---------------------------------------------------------------------
create index idx_academic_terms_school_id    on public.academic_terms (school_id);
create index idx_users_school_id             on public.users (school_id);
create index idx_users_email                 on public.users (email);
create index idx_students_school_id          on public.students (school_id);
create index idx_students_school_class       on public.students (school_id, class_name, stream);
create index idx_links_parent_id             on public.parent_student_links (parent_id);
create index idx_links_student_id            on public.parent_student_links (student_id);
create index idx_attendance_student_id       on public.attendance (student_id);
create index idx_attendance_date             on public.attendance (date);
create index idx_behavior_student_id         on public.behavior_logs (student_id);
create index idx_behavior_created_at         on public.behavior_logs (created_at desc);
create index idx_grades_student_id           on public.grades (student_id);
create index idx_grades_term_id              on public.grades (term_id);
create index idx_sms_logs_school_id          on public.sms_logs (school_id);
create index idx_sms_logs_created_at         on public.sms_logs (created_at desc);

-- ---------------------------------------------------------------------
-- 3. HELPER FUNCTIONS
-- SECURITY DEFINER so they can read public.users / links without triggering
-- RLS recursion inside policies.
-- ---------------------------------------------------------------------

create or replace function public.get_user_role()
returns text
language sql stable security definer set search_path = public
as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.get_user_school_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select school_id from public.users where id = auth.uid()
$$;

-- True when the current user is a parent linked to the student AND has given PDPA consent.
create or replace function public.is_parent_of(p_student_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.parent_student_links l
    where l.parent_id = auth.uid()
      and l.student_id = p_student_id
      and l.consent_given = true
  )
$$;

create or replace function public.student_school_id(p_student_id uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select school_id from public.students where id = p_student_id
$$;

revoke all on function public.get_user_role()            from public, anon;
revoke all on function public.get_user_school_id()       from public, anon;
revoke all on function public.is_parent_of(uuid)         from public, anon;
revoke all on function public.student_school_id(uuid)    from public, anon;
grant execute on function public.get_user_role()         to authenticated;
grant execute on function public.get_user_school_id()    to authenticated;
grant execute on function public.is_parent_of(uuid)      to authenticated;
grant execute on function public.student_school_id(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 4. TRIGGERS
-- ---------------------------------------------------------------------

-- 4a. Create the profile row after every auth signup.
-- SECURITY: role and school_id are read from raw_app_meta_data, which only the
-- service role can set. Self-signups via the public API always become 'parent'
-- with no school (and therefore see no data).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_role   text := coalesce(new.raw_app_meta_data ->> 'role', 'parent');
  v_school uuid;
begin
  if v_role not in ('parent', 'teacher', 'admin', 'super_admin') then
    v_role := 'parent';
  end if;

  begin
    v_school := nullif(new.raw_app_meta_data ->> 'school_id', '')::uuid;
  exception when others then
    v_school := null;
  end;

  insert into public.users (id, school_id, role, full_name, phone, email)
  values (
    new.id,
    v_school,
    v_role,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, ''), '@', 1)),
    new.phone,
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4b. Prevent privilege escalation: a signed-in user may not change their own
-- role, school or id. (Service role / SQL editor have auth.uid() = null.)
create or replace function public.protect_user_privileged_columns()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and (
       new.role is distinct from old.role
    or new.school_id is distinct from old.school_id
    or new.id is distinct from old.id
  ) then
    raise exception 'Hairuhusiwi kubadilisha role au shule.';
  end if;
  return new;
end;
$$;

create trigger protect_user_privileged_columns
  before update on public.users
  for each row execute function public.protect_user_privileged_columns();

-- ---------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (enabled on ALL tables)
-- ---------------------------------------------------------------------
alter table public.schools               enable row level security;
alter table public.academic_terms        enable row level security;
alter table public.users                 enable row level security;
alter table public.students              enable row level security;
alter table public.parent_student_links  enable row level security;
alter table public.attendance            enable row level security;
alter table public.behavior_logs         enable row level security;
alter table public.grades                enable row level security;
alter table public.sms_logs              enable row level security;

-- ---- users ----------------------------------------------------------
create policy users_select_own on public.users
  for select to authenticated
  using (id = auth.uid());

-- Addition: admins must see the users (teachers/parents) of their own school.
create policy users_select_admin_school on public.users
  for select to authenticated
  using (public.get_user_role() = 'admin' and school_id = public.get_user_school_id());

create policy users_select_super_admin on public.users
  for select to authenticated
  using (public.get_user_role() = 'super_admin');

create policy users_update_own on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---- schools --------------------------------------------------------
create policy schools_select_own on public.schools
  for select to authenticated
  using (id = public.get_user_school_id());

create policy schools_super_admin_all on public.schools
  for all to authenticated
  using (public.get_user_role() = 'super_admin')
  with check (public.get_user_role() = 'super_admin');

-- ---- academic_terms -------------------------------------------------
create policy terms_select_own_school on public.academic_terms
  for select to authenticated
  using (school_id = public.get_user_school_id());

create policy terms_admin_all on public.academic_terms
  for all to authenticated
  using (public.get_user_role() = 'admin' and school_id = public.get_user_school_id())
  with check (public.get_user_role() = 'admin' and school_id = public.get_user_school_id());

-- ---- students -------------------------------------------------------
create policy students_parent_select on public.students
  for select to authenticated
  using (public.get_user_role() = 'parent' and public.is_parent_of(id));

create policy students_teacher_select on public.students
  for select to authenticated
  using (public.get_user_role() = 'teacher' and school_id = public.get_user_school_id());

create policy students_admin_all on public.students
  for all to authenticated
  using (public.get_user_role() = 'admin' and school_id = public.get_user_school_id())
  with check (public.get_user_role() = 'admin' and school_id = public.get_user_school_id());

-- ---- parent_student_links -------------------------------------------
create policy links_parent_select on public.parent_student_links
  for select to authenticated
  using (parent_id = auth.uid());

create policy links_admin_all on public.parent_student_links
  for all to authenticated
  using (public.get_user_role() = 'admin' and public.student_school_id(student_id) = public.get_user_school_id())
  with check (public.get_user_role() = 'admin' and public.student_school_id(student_id) = public.get_user_school_id());

-- ---- attendance -----------------------------------------------------
create policy attendance_parent_select on public.attendance
  for select to authenticated
  using (public.get_user_role() = 'parent' and public.is_parent_of(student_id));

create policy attendance_teacher_select on public.attendance
  for select to authenticated
  using (public.get_user_role() = 'teacher' and public.student_school_id(student_id) = public.get_user_school_id());

create policy attendance_teacher_insert on public.attendance
  for insert to authenticated
  with check (
    public.get_user_role() = 'teacher'
    and public.student_school_id(student_id) = public.get_user_school_id()
    and teacher_id = auth.uid()
  );

-- Addition: teachers must be able to correct today's register (upsert = insert + update).
create policy attendance_teacher_update on public.attendance
  for update to authenticated
  using (public.get_user_role() = 'teacher' and public.student_school_id(student_id) = public.get_user_school_id())
  with check (public.get_user_role() = 'teacher' and public.student_school_id(student_id) = public.get_user_school_id());

create policy attendance_admin_all on public.attendance
  for all to authenticated
  using (public.get_user_role() = 'admin' and public.student_school_id(student_id) = public.get_user_school_id())
  with check (public.get_user_role() = 'admin' and public.student_school_id(student_id) = public.get_user_school_id());

-- ---- behavior_logs --------------------------------------------------
create policy behavior_parent_select on public.behavior_logs
  for select to authenticated
  using (public.get_user_role() = 'parent' and public.is_parent_of(student_id));

create policy behavior_teacher_select on public.behavior_logs
  for select to authenticated
  using (public.get_user_role() = 'teacher' and public.student_school_id(student_id) = public.get_user_school_id());

create policy behavior_teacher_insert on public.behavior_logs
  for insert to authenticated
  with check (
    public.get_user_role() = 'teacher'
    and public.student_school_id(student_id) = public.get_user_school_id()
    and teacher_id = auth.uid()
  );

create policy behavior_admin_all on public.behavior_logs
  for all to authenticated
  using (public.get_user_role() = 'admin' and public.student_school_id(student_id) = public.get_user_school_id())
  with check (public.get_user_role() = 'admin' and public.student_school_id(student_id) = public.get_user_school_id());

-- ---- grades ---------------------------------------------------------
create policy grades_parent_select on public.grades
  for select to authenticated
  using (public.get_user_role() = 'parent' and public.is_parent_of(student_id));

create policy grades_teacher_select on public.grades
  for select to authenticated
  using (public.get_user_role() = 'teacher' and public.student_school_id(student_id) = public.get_user_school_id());

create policy grades_teacher_insert on public.grades
  for insert to authenticated
  with check (
    public.get_user_role() = 'teacher'
    and public.student_school_id(student_id) = public.get_user_school_id()
    and teacher_id = auth.uid()
  );

create policy grades_admin_all on public.grades
  for all to authenticated
  using (public.get_user_role() = 'admin' and public.student_school_id(student_id) = public.get_user_school_id())
  with check (public.get_user_role() = 'admin' and public.student_school_id(student_id) = public.get_user_school_id());

-- ---- sms_logs -------------------------------------------------------
-- Rows are written only by the server (service role bypasses RLS).
create policy sms_logs_admin_select on public.sms_logs
  for select to authenticated
  using (public.get_user_role() = 'admin' and school_id = public.get_user_school_id());
