import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { TZ_REGIONS } from '@/lib/constants';

const schema = z.object({
  schoolName: z.string().trim().min(2).max(120),
  region: z.enum(TZ_REGIONS),
  headName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(72),
});

/**
 * Registers a new school and its first admin.
 * Uses the service-role key (server only). The DB trigger creates the profile
 * from app_metadata, which clients can never set themselves.
 */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Taarifa ulizojaza si sahihi. Angalia fomu na ujaribu tena.' }, { status: 400 });
  }
  const { schoolName, region, headName, email, password } = parsed.data;
  const admin = createAdminClient();

  const { data: school, error: schoolError } = await admin
    .from('schools')
    .insert({ name: schoolName, region })
    .select('id')
    .single();
  if (schoolError || !school) {
    return NextResponse.json({ error: 'Imeshindwa kuunda shule.' }, { status: 500 });
  }

  const { data: created, error: userError } = await admin.auth.admin.createUser({
    email: email.toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { full_name: headName },
    app_metadata: { role: 'admin', school_id: school.id },
  });

  if (userError || !created.user) {
    // Roll back the school so we do not leave orphans.
    await admin.from('schools').delete().eq('id', school.id);
    const exists = userError?.message.toLowerCase().includes('already');
    return NextResponse.json(
      { error: exists ? 'Barua pepe hii imeshasajiliwa. Jaribu kuingia.' : 'Imeshindwa kuunda akaunti ya msimamizi.' },
      { status: exists ? 409 : 500 },
    );
  }

  // Default academic term so teachers can upload grades right away.
  const year = new Date().getFullYear();
  await admin.from('academic_terms').insert({
    school_id: school.id,
    name: 'Muhula wa Kwanza',
    year,
    start_date: `${year}-01-01`,
    end_date: `${year}-06-30`,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
