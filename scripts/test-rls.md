# Mwongozo wa kujaribu RLS (Row Level Security)

Lengo: kuthibitisha kwamba **mzazi A hawezi kuona data ya mtoto wa mzazi B**, na kwamba walimu/wazazi hawavuki mipaka yao.

Seed inatengeneza akaunti hizi (nywila zote: `Password123!`):

| Role   | Barua pepe                 | Anaona                     |
|--------|----------------------------|----------------------------|
| admin  | admin@shulepulse.test      | shule yote                 |
| mwalimu| mwalimu1@shulepulse.test   | wanafunzi wote wa shule    |
| mzazi A| mzazi1@shulepulse.test     | Neema, Baraka              |
| mzazi B| mzazi2@shulepulse.test     | Zawadi                     |
| mzazi C| mzazi3@shulepulse.test     | Juma, Rehema               |

IDs za wanafunzi: `bbbbbbbb-0000-0000-0000-00000000000N` (N = 1..5). Zawadi (mtoto wa mzazi B) ni `...0003`.

---

## Njia 1: Kupitia SQL Editor (haraka, bila UI)

SQL Editor huendeshwa kama `postgres` (inapita RLS), kwa hiyo tunaiga mtumiaji kwa kubadilisha role na JWT claims **ndani ya transaction**.

### Mzazi A (mzazi1) anajaribu kuona data yake na ya mzazi B

```sql
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000004","role":"authenticated"}';

-- Anapaswa kuona wanafunzi 2 tu (Neema, Baraka)
select full_name from public.students;

-- Anajaribu kuomba mtoto wa mzazi B moja kwa moja -> 0 rows
select * from public.students   where id         = 'bbbbbbbb-0000-0000-0000-000000000003';
select * from public.attendance where student_id = 'bbbbbbbb-0000-0000-0000-000000000003';
select * from public.grades     where student_id = 'bbbbbbbb-0000-0000-0000-000000000003';
select * from public.behavior_logs where student_id = 'bbbbbbbb-0000-0000-0000-000000000003';

-- Haoni profile za watumiaji wengine -> 1 row (yake tu)
select id, full_name, role from public.users;

-- Hawezi kuandika mahudhurio -> ERROR: new row violates row-level security policy
insert into public.attendance (student_id, date, status)
values ('bbbbbbbb-0000-0000-0000-000000000001', '2025-03-01', 'present');

rollback;
```

**Matokeo yanayotarajiwa:** query ya wanafunzi inarudisha 2; query za mtoto wa mzazi B zinarudisha **0 rows**; `users` inarudisha 1; insert inakataliwa kwa kosa la RLS.

### Mzazi B (mzazi2) anaona mtoto wake tu

```sql
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000005","role":"authenticated"}';
select full_name from public.students;   -- Zawadi Komba tu
rollback;
```

### Mwalimu hawezi kubadilisha role yake (privilege escalation)

```sql
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000002","role":"authenticated"}';
update public.users set role = 'admin' where id = 'aaaaaaaa-0000-0000-0000-000000000002';
-- Inapaswa kutoa kosa: Hairuhusiwi kubadilisha role au shule.
rollback;
```

### Mzazi bila idhini (PDPA) haoni data

```sql
-- (kama postgres) ondoa idhini ya mzazi A kwa muda
begin;
update public.parent_student_links set consent_given = false
  where parent_id = 'aaaaaaaa-0000-0000-0000-000000000004';

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000004","role":"authenticated"}';
select count(*) from public.students;   -- 0 (hadi akubali idhini)
rollback;
```

---

## Njia 2: Kupitia programu (UI + browser console)

1. Fungua dirisha la incognito. Ingia kama **mzazi1@shulepulse.test** / `Password123!`.
2. Utaona watoto wawili tu kwenye dashibodi (Neema, Baraka).
3. Fungua DevTools -> Console na endesha (badilisha URL na key kwa zako, au tumia ukurasa wowote wa app):

```js
// Tumia Network tab kuona maombi ya Supabase; au jaribu moja kwa moja kwa REST:
const url = 'https://YOUR-PROJECT.supabase.co/rest/v1/students?id=eq.bbbbbbbb-0000-0000-0000-000000000003&select=*';
const token = JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => k.includes('auth-token')) ?? '{}') ?? '{}');
// Kama token haipo kwenye localStorage (cookies hutumika), tumia SQL Editor Njia 1.
```

   Kwa kuwa app hutumia cookies, njia ya kuaminika zaidi ni **Njia 1**.
4. Jaribu URL ya mtoto wa mzazi B: `/parent/child/bbbbbbbb-0000-0000-0000-000000000003/grades`
   **Inatarajiwa:** ukurasa wa 404 ("haipatikani"), hakuna data.
5. Ingia kama **mzazi2@shulepulse.test** na uthibitishe anaona Zawadi tu.

---

## Orodha ya uthibitisho

- [ ] Mzazi A anaona wanafunzi 2 tu.
- [ ] Mzazi A: query ya mtoto wa mzazi B inarudisha 0 rows (students, attendance, grades, behavior_logs).
- [ ] Mzazi A hawezi INSERT attendance.
- [ ] Mwalimu anaona wanafunzi wote 5 wa shule yake, na anaweza INSERT attendance.
- [ ] Mwalimu hawezi kubadilisha `role` yake.
- [ ] Mzazi bila `consent_given` haoni data yoyote.
- [ ] `select * from public.sms_logs` kama mwalimu au mzazi inarudisha 0 rows.
