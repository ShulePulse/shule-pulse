# Setup

## A. Kutumia repo hii (njia ya kawaida)

```bash
npm install
cp .env.local.example .env.local
npm run typecheck
npm run dev
```

### Supabase

1. Unda project kwenye https://supabase.com (chagua region iliyo karibu, mfano Frankfurt/London).
2. Project Settings -> API: nakili `Project URL`, `anon public key` na `service_role key` kwenye `.env.local`.
3. SQL Editor -> New query -> bandika `supabase/migrations/001_init.sql` -> Run.
4. (Hiari, demo) SQL Editor -> bandika `supabase/seed.sql` -> Run.
5. Authentication -> URL Configuration: weka Site URL `http://localhost:3000` na Redirect URL `http://localhost:3000/auth/callback`.

### Beem SMS

Weka `BEEM_API_KEY`, `BEEM_SECRET` na `BEEM_SENDER_ID` (lazima isajiliwe Beem). Wakati wa maendeleo acha `SMS_DRY_RUN=true`.

## B. Kuanzisha mradi kama huu kutoka mwanzo (rejea)

Repo hii tayari ina kila kitu. Amri hizi ni za kumbukumbu tu:

```bash
npx create-next-app@14 shule-pulse --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
cd shule-pulse

# runtime
npm i @supabase/supabase-js@^2.45 @supabase/ssr@^0.5 zod@^3.23 dexie@^4 next-pwa@^5.6 \
  @react-pdf/renderer@^3.4 xlsx@^0.18.5 recharts@^2.13 lucide-react clsx tailwind-merge \
  class-variance-authority server-only

# shadcn/ui (repo ina components.json tayari)
npx shadcn@latest init
npx shadcn@latest add button input label card badge select textarea
```

Repo hii ina matoleo mepesi ya `button`, `input`, `label`, `card`, `badge` kwenye `components/ui/` yanayolingana na shadcn.
Ukiendesha `npx shadcn@latest add ...` itakuuliza kuandika juu yake; chagua "No" kama hutaki kubadilisha mwonekano.

## Versions zilizotumika

next 14.2.15 · react 18.3 · @supabase/ssr 0.5 · @supabase/supabase-js 2.45 · dexie 4 · next-pwa 5.6 · @react-pdf/renderer 3.4 · xlsx 0.18.5 · recharts 2.13 · zod 3.23 · tailwindcss 3.4 · typescript 5.6

## Makosa ya kawaida

| Tatizo | Suluhisho |
|--------|-----------|
| `Missing NEXT_PUBLIC_SUPABASE_URL` | `.env.local` haipo au server haikuanzishwa upya baada ya kuhariri. |
| Login: "Database error querying schema" baada ya seed | Endesha seed upya kwenye project mpya; usi-edit `auth.users` kwa mkono. |
| `permission denied` / data tupu | RLS inakataa: hakikisha role/school_id ya mtumiaji ni sahihi (angalia `public.users`). |
| Mzazi anaona dashibodi tupu | `consent_given` ni false (apitie `/consent`) au hajaunganishwa na mtoto. |
| Auth callback inarudi `/login?error=callback` | Ongeza `/auth/callback` kwenye Redirect URLs za Supabase. |
| PWA haionekani kwenye dev | next-pwa imezimwa kwenye `npm run dev`; jaribu `npm run build && npm start`. |
| `Module not found: canvas` kwenye PDF | Hakikisha `experimental.serverComponentsExternalPackages` ipo kwenye `next.config.js`. |
| Type errors baada ya kubadilisha schema | Sasisha `types/database.ts` au tengeneza upya: `npx supabase gen types typescript`. |
