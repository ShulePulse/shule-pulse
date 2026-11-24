// Shared constants. This file must not import from `types/` (types derive from it).

export const ROLES = ['parent', 'teacher', 'admin', 'super_admin'] as const;

/** Where each role lands after login. */
export const ROLE_HOME = {
  parent: '/parent/dashboard',
  teacher: '/teacher/dashboard',
  admin: '/admin/dashboard',
  super_admin: '/admin/dashboard',
} as const;

/** Route prefix -> roles allowed to open it. Used by middleware. */
export const ROUTE_ROLES: ReadonlyArray<{ prefix: string; roles: ReadonlyArray<(typeof ROLES)[number]> }> = [
  { prefix: '/teacher', roles: ['teacher'] },
  { prefix: '/parent', roles: ['parent'] },
  { prefix: '/admin', roles: ['admin', 'super_admin'] },
  { prefix: '/consent', roles: ['parent'] },
];

export const ROLE_LABELS = {
  parent: 'Mzazi',
  teacher: 'Mwalimu',
  admin: 'Msimamizi wa shule',
  super_admin: 'Msimamizi mkuu',
} as const;

export const ATTENDANCE_STATUS = {
  present: 'Yupo',
  absent: 'Hayupo',
  late: 'Amechelewa',
} as const;

/** Behavior tags and the severity each one maps to (severity is decided server-side). */
export const BEHAVIOR_TAGS = [
  { value: 'Amechelewa', severity: 'negative' },
  { value: 'Kazi haijafanywa', severity: 'negative' },
  { value: 'Uongozi bora', severity: 'positive' },
  { value: 'Kuvuruga', severity: 'negative' },
] as const;

export const SEVERITIES = ['positive', 'neutral', 'negative'] as const;

export const RELATIONSHIPS = ['Mother', 'Father', 'Guardian'] as const;
export const RELATIONSHIP_LABELS = { Mother: 'Mama', Father: 'Baba', Guardian: 'Mlezi' } as const;

export const SUBJECTS = [
  'Kiswahili',
  'English',
  'Hisabati',
  'Fizikia',
  'Kemia',
  'Baiolojia',
  'Historia',
  'Jiografia',
  'Uraia',
  'Commerce',
  'Book-keeping',
] as const;

export const TZ_REGIONS = [
  'Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa', 'Kagera', 'Katavi', 'Kigoma',
  'Kilimanjaro', 'Lindi', 'Manyara', 'Mara', 'Mbeya', 'Morogoro', 'Mtwara', 'Mwanza',
  'Njombe', 'Pwani', 'Rukwa', 'Ruvuma', 'Shinyanga', 'Simiyu', 'Singida', 'Songwe',
  'Tabora', 'Tanga', 'Mjini Magharibi', 'Unguja Kaskazini', 'Unguja Kusini',
  'Pemba Kaskazini', 'Pemba Kusini',
] as const;

export const TIMEZONE = 'Africa/Dar_es_Salaam';
export const ATTENDANCE_TARGET_SECONDS = 20;
