# Mwongozo wa majaribio

Tumia akaunti za seed (nywila `Password123!`): `admin@shulepulse.test`, `mwalimu1@shulepulse.test`, `mzazi1@shulepulse.test`.
Tumia `SMS_DRY_RUN=true` ili SMS zisitumwe kweli.

## 1. Auth na role redirect

1. Fungua `/register-school`, jaza fomu (barua pepe mpya) -> unapelekwa `/admin/dashboard`.
2. Toka. Ingia kama `mzazi1@...` -> `/parent/dashboard`. Mwalimu -> `/teacher/dashboard`. Admin -> `/admin/dashboard`.
3. Kama mzazi, fungua `/admin/dashboard` kwa mkono. **Inatarajiwa:** unarudishwa `/parent/dashboard` na ujumbe "Huna ruhusa".
4. Toka, kisha fungua `/teacher/dashboard`. **Inatarajiwa:** unapelekwa `/login`.
5. Idhini ya PDPA: kama admin, ongeza mwanafunzi na mzazi mpya (jaza sehemu ya mzazi). Ingia kwa nywila ya muda iliyoonyeshwa -> unapelekwa `/consent`. Bila kuweka tiki "Nakubali" kitufe kimezimwa. Ukikubali -> dashboard.

## 2. Mahudhurio ya wanafunzi 10 kwa chini ya sekunde 20

1. Ingia kama mwalimu. Kama una wanafunzi wachache tu, tumia `/admin/import` (kama admin) kuingiza wanafunzi 10 wa darasa moja kwa kutumia `public/templates/students-template.csv`.
2. Mwalimu: Dashibodi -> darasa -> Mahudhurio. Timer huanza ukurasa unapofunguka.
3. Bofya wanafunzi 2 wasiokuwepo, kisha **Wasilisha**.
4. **Inatarajiwa:** ujumbe wa kijani na muda (lengo `<= 20s`). Fungua tena ukurasa: hali zilizohifadhiwa zinaonekana.
5. Kama mzazi wa mtoto huyo ana idhini na namba ya simu, angalia `sms_logs` (Supabase Table Editor): mstari na `error = dry-run` (au `sent` kama SMS_DRY_RUN=false).

## 3. Offline

1. Tumia production build: `npm run build && npm start` (PWA imezimwa kwenye dev).
2. Ingia kama mwalimu, fungua ukurasa wa mahudhurio wa darasa mara moja ukiwa online.
3. DevTools -> Network -> **Offline**. Banner ya njano inaonekana.
4. Weka wanafunzi hayupo, bofya **Wasilisha**. **Inatarajiwa:** ujumbe "Imehifadhiwa..."; DevTools -> Application -> IndexedDB -> `shulepulse` -> `queue` ina kipengele.
5. Rudisha Network kuwa **Online**. **Inatarajiwa:** banner ya bluu "Inasawazisha", kisha kijani "Imesawazishwa". `queue` inakuwa tupu na `attendance` ina rekodi mpya.

Kikomo kinachojulikana: ukurasa wa darasa lazima uwe umefunguliwa angalau mara moja online ili ufunguke offline.

## 4. Upakiaji wa alama (Excel/CSV)

1. Mwalimu -> "Pakia alama". Chagua muhula, jina la mtihani.
2. Buruta `public/templates/grades-template.csv` kwenye eneo la kuacha.
3. Thibitisha safu zimechaguliwa moja kwa moja; angalia preview (sahihi/makosa).
4. **Ingiza alama**. **Inatarajiwa:** "Alama N zimeingizwa". Namba zisizojulikana zinaorodheshwa kama zimerukwa.
5. Mzazi wa mtoto huyo anaona alama kwenye `/parent/child/<id>/grades` (chati zinaonekana).

## 5. Mzazi: feed na RLS

1. Mzazi 1: dashboard inaonyesha Neema na Baraka tu (kuna switcher).
2. Fungua `/parent/child/bbbbbbbb-0000-0000-0000-000000000003/grades` (mtoto wa mzazi 2). **Inatarajiwa:** 404.
3. Majaribio ya SQL: angalia `scripts/test-rls.md`.

## 6. SMS (Beem)

- Dev: `curl -X POST http://localhost:3000/api/sms/test -H "Content-Type: application/json" -b "<cookie ya session>" -d '{"phone":"0712345678"}'`
  (rahisi zaidi: tumia console ya browser ukiwa umeingia: `fetch('/api/sms/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:'0712345678'})}).then(r=>r.json()).then(console.log)`)
- Beem haitoi sandbox ambayo tunaweza kuthibitisha hapa. Jaribu kwa namba yako mwenyewe na salio dogo, `SMS_DRY_RUN=false`, `BEEM_SENDER_ID` iliyosajiliwa. Thibitisha format ya ombi kwenye https://docs.beem.africa.
- Route `/api/sms/test` inarudisha 404 kwenye production.

## 7. Mfumo mzima (end-to-end)

1. `/register-school` -> unda shule -> unaingia kama admin.
2. Admin: Walimu -> ongeza mwalimu. Wanafunzi -> ongeza mwanafunzi + mzazi (nakili nywila ya muda).
3. Toka. Ingia kama mwalimu -> mahudhurio, weka mwanafunzi hayupo -> Wasilisha.
4. Pakia alama (hatua 4).
5. Toka. Ingia kama mzazi (nywila ya muda) -> kubali idhini -> Pulse Feed inaonyesha "Hayupo" na alama.
6. Mzazi: Alama -> "Pakua ripoti (PDF)". Admin: Ripoti za PDF -> chagua mwanafunzi na muhula -> "Zalisha PDF". **Inatarajiwa:** PDF inafunguka na jina la shule, alama, mahudhurio, tabia na maoni.
