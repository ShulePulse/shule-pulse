# ShulePulse

Mfumo wa mawasiliano ya shule kwa wakati halisi kwa walimu, wazazi na shule za Tanzania.

## Mradi ni nini

Kupunguza ugumu wa walimu: kuingiza mahudhurio na tabia kwa sekunde 15, kufanya kazi **bila mtandao**, na kutuma **SMS** kwa wazazi kwa wakati. Hii si mfumo kamili wa shule. Ni MVP ya kujaribu na shule 1-2 za kibinafsi kabla ya kupanua.

**Lengo kuu:** mwalimu wa darasa la wanafunzi 40 akamilishe mahudhurio kwa chini ya sekunde 20, hata bila mtandao.

## Teknolojia

Next.js 14 (App Router) · TypeScript strict · Tailwind + shadcn/ui · Supabase (Postgres, Auth, RLS) · next-pwa + Dexie.js (offline) · Beem Africa (SMS) · @react-pdf/renderer · SheetJS (Excel/CSV) · Vercel.

## Jinsi ya kuanza

Mahitaji: Node.js 18.18+, akaunti ya Supabase (bure), Git.

```bash
git clone https://github.com/<WEWE>/shule-pulse.git
cd shule-pulse
npm install
cp .env.local.example .env.local      # jaza thamani za Supabase
```

1. Kwenye Supabase SQL Editor, endesha `supabase/migrations/001_init.sql`.
2. (Demo tu) endesha `supabase/seed.sql`. Akaunti zote zina nywila `Password123!`.
3. `npm run dev` kisha fungua http://localhost:3000.

Maelezo kamili: [`docs/SETUP.md`](docs/SETUP.md) · Majaribio: [`docs/TESTING.md`](docs/TESTING.md) · RLS: [`scripts/test-rls.md`](scripts/test-rls.md) · Hosting: [`DEPLOYMENT.md`](DEPLOYMENT.md).

## Muundo wa mradi

```
app/(auth)/      login, register-school, forgot/reset-password, consent (PDPA)
app/(teacher)/   dashboard, attendance/[classId], behavior/[classId], grades/upload
app/(parent)/    dashboard (Pulse Feed), child/[id]/grades, child/[id]/attendance
app/(admin)/     dashboard, students, teachers, import, reports
app/api/         auth, consent, attendance, behavior, grades, sms, pdf, admin
components/      ui, teacher, parent, admin, shared
lib/             supabase, sms, offline, pdf, admin, utils, constants
supabase/        migrations/001_init.sql, seed.sql
types/           database.ts, index.ts
```

## Majukumu ya timu

| Mhusika | Anamiliki |
|---------|-----------|
| Backend A: Database & Security | `supabase/`, `types/database.ts` |
| Backend B: API & Integration | `app/api/`, `lib/sms/`, `lib/supabase/` |
| Frontend A: Teacher & Admin UI | `app/(teacher)/`, `app/(admin)/`, `components/teacher/`, `components/admin/` |
| Frontend B: Parent & Auth UI | `app/(parent)/`, `app/(auth)/`, `components/parent/` |

Kila PR: mmiliki wa timu anamerge na ku-deploy (Vercel Hobby).

## Usalama (muhimu)

- RLS imewashwa kwa tables zote; ujaribu kwa mkono baada ya kila mabadiliko ya schema.
- `SUPABASE_SERVICE_ROLE_KEY` na `BEEM_SECRET` ni server-side tu. Usizi-commit.
- Mzazi haoni data ya mtoto hadi akubali idhini ya PDPA.
