# Deployment: GitHub -> Vercel + Supabase

## 1. GitHub

```bash
git init
git add .
git commit -m "ShulePulse MVP"
git branch -M main
git remote add origin https://github.com/<WEWE>/shule-pulse.git
git push -u origin main
```

Hakikisha `.env.local` haimo (iko kwenye `.gitignore`). Kagua: `git ls-files | grep -i env` (inapaswa kuonyesha `.env.local.example` tu).

**Vercel Hobby:** hifadhi ya GitHub iliyo chini ya Organization ya faragha haiwezi ku-deploy kwenye Hobby. Weka repo chini ya akaunti ya mmiliki wa timu (ndiye anayemerge na ku-deploy), au tumia Vercel Pro baadaye.

## 2. Supabase production project

1. Unda project **mpya** kwa production (usitumie ile ya majaribio). Chagua region karibu na watumiaji.
2. SQL Editor: endesha `supabase/migrations/001_init.sql`. **Usiendeshe `seed.sql` production** (ina nywila zinazojulikana).
3. Authentication -> Providers -> Email: washa. Fikiria kuwasha "Confirm email" ukipanua usajili wa umma.
4. Authentication -> URL Configuration:
   - Site URL: `https://app.yourdomain.co.tz`
   - Redirect URLs: `https://app.yourdomain.co.tz/auth/callback`
5. Authentication -> SMTP: weka SMTP yako (mfano Resend/SendGrid) ili barua za kuweka upya nenosiri zifike; SMTP ya chaguo-msingi ina kikomo kidogo.
6. Settings -> Database: washa backups (Pro) au panga `pg_dump` ya kila wiki.
7. Unda super_admin wako (mara moja): unda user kwenye Authentication -> Users, kisha SQL Editor:
   ```sql
   update public.users set role = 'super_admin', school_id = null where email = 'wewe@example.com';
   ```

## 3. Vercel

1. vercel.com -> Add New -> Project -> chagua repo -> Framework: Next.js (inagunduliwa).
2. Settings -> Environment Variables (Production na Preview):

   | Jina | Thamani | Siri? |
   |------|---------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | URL ya project | Hapana |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key | Hapana (iko wazi kwa browser, RLS inalinda) |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key | **NDIYO** |
   | `BEEM_API_KEY`, `BEEM_SECRET` | kutoka Beem | **NDIYO** |
   | `BEEM_SENDER_ID` | Sender ID iliyoidhinishwa | Hapana |
   | `SMS_DRY_RUN` | `false` (production) | Hapana |
   | `NEXT_PUBLIC_APP_URL` | `https://app.yourdomain.co.tz` | Hapana |

3. Deploy. Kila `git push` kwenye `main` ina-deploy upya.
4. Baada ya deploy, rudia majaribio ya `docs/TESTING.md` kwenye URL ya production (hasa RLS na offline).

## 4. Domain

1. Vercel -> Project -> Settings -> Domains -> Add `app.yourdomain.co.tz`.
2. Kwa msajili wa domain (mfano `.co.tz` kupitia TZNIC registrar) ongeza rekodi ya CNAME `app` -> `cname.vercel-dns.com` (au ile ambayo Vercel inaonyesha).
3. Subiri HTTPS ya Vercel iwe active, kisha sasisha Site URL/Redirect URLs za Supabase na `NEXT_PUBLIC_APP_URL`.

## 5. Mipaka ya Vercel Hobby unayopaswa kujua

- Functions zina muda mfupi (sekunde ~10-60). Import ya wanafunzi inatumwa kwa vipande vya 50 kwa sababu hii.
- Matumizi ya kibiashara hayaruhusiwi kwenye Hobby kwa masharti ya Vercel; panga Pro unapoanza kuuza.

## 6. Orodha ya PDPA kabla ya ku-host

Sheria ya Ulinzi wa Taarifa Binafsi ya Tanzania (2022) inahusu data ya watoto, kwa hiyo kagua na mwanasheria kabla ya kuingiza wanafunzi halisi.

- [ ] Usajili wa shirika lako kama controller/processor na Tume ya Ulinzi wa Taarifa Binafsi (PDPC), kama inavyohitajika.
- [ ] Maandishi ya idhini kwenye `app/(auth)/consent/ConsentForm.tsx` yamepitiwa na mwanasheria.
- [ ] Sera ya faragha na masharti ya matumizi zimechapishwa na kuunganishwa kwenye tovuti.
- [ ] Mkataba wa usindikaji data (DPA) na kila shule.
- [ ] Njia ya mzazi kuomba kuona/kusahihisha/kufuta data, au kuondoa idhini (kwa sasa kupitia shule; panga kipengele cha ndani).
- [ ] Sera ya muda wa kuhifadhi data (mfano futa data ya wanafunzi walioondoka baada ya X miaka).
- [ ] Supabase region na uhamishaji wa data nje ya nchi umepitiwa kisheria.
- [ ] RLS imejaribiwa kwenye production (`scripts/test-rls.md`).
- [ ] `seed.sql` haijaendeshwa production; hakuna akaunti za `@shulepulse.test`.
- [ ] Service-role key haijawahi kuwekwa kwenye code, logs au chat; zungusha key kama ilivyovuja.
- [ ] Ufikiaji wa dashboard ya Supabase/Vercel umelindwa kwa 2FA.
- [ ] Mpango wa kuripoti uvujaji wa data (nani anaarifiwa, ndani ya muda gani).

## 7. Checklist ya deployment

- [ ] Repo iko GitHub, `.env.local` haimo
- [ ] Supabase production imeundwa, `001_init.sql` imeendeshwa
- [ ] Redirect URLs na SMTP vimewekwa
- [ ] super_admin ameundwa
- [ ] Env variables zote kwenye Vercel (Production + Preview)
- [ ] `SMS_DRY_RUN=false`, Beem Sender ID imeidhinishwa na ina salio
- [ ] Deploy imefaulu, `/login` inafunguka kwa HTTPS
- [ ] Mtiririko mzima (docs/TESTING.md #7) umejaribiwa production
- [ ] RLS imejaribiwa production
- [ ] Offline imejaribiwa kwenye simu halisi (Android Chrome: "Add to Home screen")
- [ ] Domain imeunganishwa na HTTPS iko active
- [ ] Orodha ya PDPA imekamilika
- [ ] Backups zimewashwa

## 8. Mambo yasiyomo kwenye MVP (yajayo)

- Kuongeza/kuhariri miezi (terms) kupitia UI (muhula mmoja wa chaguo-msingi huundwa shule inaposajiliwa).
- Kuingia kwa wazazi bila barua pepe (OTP ya simu).
- Kikomo cha idadi ya maombi (rate limiting) kwenye `/api/auth/signup-school`, na uthibitisho wa barua pepe/CAPTCHA kwa usajili wa shule.
- Kuondoa idhini ya PDPA ndani ya app.
