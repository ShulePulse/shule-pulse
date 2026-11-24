// Tiny dictionary for the admin Kiswahili / English toggle.
export type Lang = 'sw' | 'en';

const dict = {
  'nav.dashboard': { sw: 'Dashibodi', en: 'Dashboard' },
  'nav.students': { sw: 'Wanafunzi', en: 'Students' },
  'nav.teachers': { sw: 'Walimu', en: 'Teachers' },
  'nav.import': { sw: 'Ingiza Excel', en: 'Excel import' },
  'nav.reports': { sw: 'Ripoti za PDF', en: 'PDF reports' },
  'nav.logout': { sw: 'Toka', en: 'Log out' },
  'common.save': { sw: 'Hifadhi', en: 'Save' },
  'common.cancel': { sw: 'Ghairi', en: 'Cancel' },
  'common.delete': { sw: 'Futa', en: 'Delete' },
  'common.edit': { sw: 'Hariri', en: 'Edit' },
  'common.add': { sw: 'Ongeza', en: 'Add' },
  'common.name': { sw: 'Jina kamili', en: 'Full name' },
  'common.phone': { sw: 'Simu', en: 'Phone' },
  'common.email': { sw: 'Barua pepe', en: 'Email' },
  'common.actions': { sw: 'Vitendo', en: 'Actions' },
  'common.search': { sw: 'Tafuta...', en: 'Search...' },
  'common.confirmDelete': { sw: 'Una uhakika unataka kufuta? Hatua hii haiwezi kurudishwa.', en: 'Are you sure you want to delete? This cannot be undone.' },
  'dash.title': { sw: 'Dashibodi ya shule', en: 'School dashboard' },
  'dash.students': { sw: 'Wanafunzi', en: 'Students' },
  'dash.teachers': { sw: 'Walimu', en: 'Teachers' },
  'dash.parents': { sw: 'Wazazi', en: 'Parents' },
  'dash.sms': { sw: 'SMS zilizotumwa', en: 'SMS sent' },
  'students.title': { sw: 'Wanafunzi', en: 'Students' },
  'students.add': { sw: 'Ongeza mwanafunzi', en: 'Add student' },
  'students.admission': { sw: 'Namba ya usajili', en: 'Admission no.' },
  'students.class': { sw: 'Darasa', en: 'Class' },
  'students.stream': { sw: 'Mkondo', en: 'Stream' },
  'students.parentInfo': { sw: 'Mzazi / mlezi (hiari)', en: 'Parent / guardian (optional)' },
  'students.parentName': { sw: 'Jina la mzazi', en: 'Parent name' },
  'students.relationship': { sw: 'Uhusiano', en: 'Relationship' },
  'students.parents': { sw: 'Wazazi', en: 'Parents' },
  'students.empty': { sw: 'Hakuna wanafunzi bado. Anza kwa kuongeza mmoja au kuingiza Excel.', en: 'No students yet. Add one or import an Excel file.' },
  'teachers.title': { sw: 'Walimu', en: 'Teachers' },
  'teachers.add': { sw: 'Ongeza mwalimu', en: 'Add teacher' },
  'teachers.password': { sw: 'Nywila ya muda (angalau herufi 8)', en: 'Temporary password (min 8 chars)' },
  'teachers.empty': { sw: 'Hakuna walimu bado.', en: 'No teachers yet.' },
  'import.title': { sw: 'Ingiza wanafunzi kutoka Excel', en: 'Import students from Excel' },
  'import.hint': { sw: 'Buruta faili ya .xlsx au .csv hapa, au bofya kuchagua.', en: 'Drag an .xlsx or .csv file here, or click to choose.' },
  'import.run': { sw: 'Ingiza wanafunzi', en: 'Import students' },
  'reports.title': { sw: 'Ripoti za PDF', en: 'PDF reports' },
  'reports.student': { sw: 'Mwanafunzi', en: 'Student' },
  'reports.term': { sw: 'Muhula', en: 'Term' },
  'reports.comment': { sw: 'Maoni ya mwalimu', en: 'Teacher comment' },
} as const satisfies Record<string, { sw: string; en: string }>;

export type I18nKey = keyof typeof dict;

export function translate(lang: Lang, key: I18nKey): string {
  return dict[key][lang];
}
