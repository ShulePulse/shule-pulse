-- =====================================================================
-- ShulePulse - seed.sql  (DEVELOPMENT / DEMO DATA ONLY - never run in production)
-- Run AFTER 001_init.sql. Safe to run once on a fresh project.
-- All demo accounts use the password:  Password123!
-- =====================================================================

-- Helper that creates an auth user. The on_auth_user_created trigger builds the
-- public.users profile from raw_app_meta_data (role + school_id).
create or replace function pg_temp.seed_user(
  p_id uuid, p_email text, p_full_name text, p_role text, p_school uuid, p_phone text
) returns void language plpgsql as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
    crypt('Password123!', gen_salt('bf')), now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'),
                       'role', p_role, 'school_id', p_school),
    jsonb_build_object('full_name', p_full_name),
    now(), now(), '', '', '', ''
  );

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (
    gen_random_uuid(), p_id, p_id::text,
    jsonb_build_object('sub', p_id::text, 'email', p_email),
    'email', now(), now(), now()
  );

  update public.users set phone = p_phone where id = p_id;
end;
$$;

-- 1. School + term -----------------------------------------------------
insert into public.schools (id, name, region)
values ('11111111-1111-1111-1111-111111111111', 'Shule ya Majaribio', 'Dar es Salaam');

insert into public.academic_terms (id, school_id, name, year, start_date, end_date)
values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
        'Muhula wa Kwanza', 2025, '2025-01-13', '2025-06-27');

-- 2. Users: 1 admin, 2 teachers, 3 parents --------------------------------
select pg_temp.seed_user('aaaaaaaa-0000-0000-0000-000000000001', 'admin@shulepulse.test',    'Amina Juma',     'admin',   '11111111-1111-1111-1111-111111111111', '255700000001');
select pg_temp.seed_user('aaaaaaaa-0000-0000-0000-000000000002', 'mwalimu1@shulepulse.test', 'John Massawe',   'teacher', '11111111-1111-1111-1111-111111111111', '255700000002');
select pg_temp.seed_user('aaaaaaaa-0000-0000-0000-000000000003', 'mwalimu2@shulepulse.test', 'Esther Kimaro',  'teacher', '11111111-1111-1111-1111-111111111111', '255700000003');
select pg_temp.seed_user('aaaaaaaa-0000-0000-0000-000000000004', 'mzazi1@shulepulse.test',   'Grace Mushi',    'parent',  '11111111-1111-1111-1111-111111111111', '255700000004');
select pg_temp.seed_user('aaaaaaaa-0000-0000-0000-000000000005', 'mzazi2@shulepulse.test',   'Hassan Komba',   'parent',  '11111111-1111-1111-1111-111111111111', '255700000005');
select pg_temp.seed_user('aaaaaaaa-0000-0000-0000-000000000006', 'mzazi3@shulepulse.test',   'Fatuma Salim',   'parent',  '11111111-1111-1111-1111-111111111111', '255700000006');

-- 3. Students (5) ------------------------------------------------------
insert into public.students (id, school_id, full_name, admission_no, class_name, stream) values
  ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Neema Mushi',      'ADM001', 'Form 1', 'A'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Baraka Mushi',     'ADM002', 'Form 2', 'A'),
  ('bbbbbbbb-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Zawadi Komba',     'ADM003', 'Form 1', 'A'),
  ('bbbbbbbb-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Juma Salim',       'ADM004', 'Form 1', 'B'),
  ('bbbbbbbb-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Rehema Mwakyusa',  'ADM005', 'Form 1', 'B');

-- 4. Parent <-> student links (consent given) --------------------------
--    Grace  -> Neema, Baraka (siblings)
--    Hassan -> Zawadi
--    Fatuma -> Juma, Rehema
insert into public.parent_student_links (parent_id, student_id, relationship, consent_given, consent_date) values
  ('aaaaaaaa-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000001', 'Mother',   true, now()),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000002', 'Mother',   true, now()),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'bbbbbbbb-0000-0000-0000-000000000003', 'Father',   true, now()),
  ('aaaaaaaa-0000-0000-0000-000000000006', 'bbbbbbbb-0000-0000-0000-000000000004', 'Guardian', true, now()),
  ('aaaaaaaa-0000-0000-0000-000000000006', 'bbbbbbbb-0000-0000-0000-000000000005', 'Guardian', true, now());

-- 5. Attendance: week 1 (Mon 2025-02-03 .. Fri 2025-02-07), 5 students x 5 days
insert into public.attendance (student_id, teacher_id, date, status)
select
  s.id,
  'aaaaaaaa-0000-0000-0000-000000000002',
  d::date,
  case
    when s.admission_no = 'ADM002' and d::date = '2025-02-05' then 'absent'
    when s.admission_no = 'ADM004' and d::date in ('2025-02-04', '2025-02-05') then 'absent'
    when s.admission_no = 'ADM005' and d::date = '2025-02-06' then 'late'
    else 'present'
  end
from public.students s
cross join generate_series('2025-02-03'::date, '2025-02-07'::date, interval '1 day') as d;

-- 6. Behavior logs (5) -------------------------------------------------
insert into public.behavior_logs (student_id, teacher_id, tag, severity, created_at) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'Uongozi bora',     'positive', '2025-02-04 10:15:00+03'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000003', 'Kazi haijafanywa', 'negative', '2025-02-05 11:00:00+03'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000002', 'Amechelewa',       'negative', '2025-02-05 07:50:00+03'),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000003', 'Kuvuruga',         'negative', '2025-02-06 09:30:00+03'),
  ('bbbbbbbb-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000002', 'Uongozi bora',     'positive', '2025-02-07 13:40:00+03');

-- 7. Grades (10): 5 students x 2 subjects --------------------------------
insert into public.grades (student_id, term_id, subject, assessment_name, score, max_score, teacher_id, created_at) values
  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Hisabati',  'Mtihani wa Mwezi', 78, 100, 'aaaaaaaa-0000-0000-0000-000000000002', '2025-02-06 14:00:00+03'),
  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Kiswahili', 'Mtihani wa Mwezi', 85, 100, 'aaaaaaaa-0000-0000-0000-000000000003', '2025-02-06 14:00:00+03'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Hisabati',  'Mtihani wa Mwezi', 55, 100, 'aaaaaaaa-0000-0000-0000-000000000002', '2025-02-06 14:00:00+03'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Kiswahili', 'Mtihani wa Mwezi', 62, 100, 'aaaaaaaa-0000-0000-0000-000000000003', '2025-02-06 14:00:00+03'),
  ('bbbbbbbb-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Hisabati',  'Mtihani wa Mwezi', 91, 100, 'aaaaaaaa-0000-0000-0000-000000000002', '2025-02-06 14:00:00+03'),
  ('bbbbbbbb-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Kiswahili', 'Mtihani wa Mwezi', 74, 100, 'aaaaaaaa-0000-0000-0000-000000000003', '2025-02-06 14:00:00+03'),
  ('bbbbbbbb-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'Hisabati',  'Mtihani wa Mwezi', 48, 100, 'aaaaaaaa-0000-0000-0000-000000000002', '2025-02-06 14:00:00+03'),
  ('bbbbbbbb-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'Kiswahili', 'Mtihani wa Mwezi', 66, 100, 'aaaaaaaa-0000-0000-0000-000000000003', '2025-02-06 14:00:00+03'),
  ('bbbbbbbb-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 'Hisabati',  'Mtihani wa Mwezi', 82, 100, 'aaaaaaaa-0000-0000-0000-000000000002', '2025-02-06 14:00:00+03'),
  ('bbbbbbbb-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 'Kiswahili', 'Mtihani wa Mwezi', 79, 100, 'aaaaaaaa-0000-0000-0000-000000000003', '2025-02-06 14:00:00+03');
