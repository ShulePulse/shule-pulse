import type { AttendanceStatus, Relationship, Role, Severity } from './index';

/**
 * Hand-written types for the schema in supabase/migrations/001_init.sql.
 * Regenerate with `npx supabase gen types typescript` once the CLI is linked.
 * NOTE: use `type` aliases (not interfaces) so rows satisfy Record<string, unknown>.
 */

export type SchoolRow = { id: string; name: string; region: string; created_at: string };
export type AcademicTermRow = {
  id: string;
  school_id: string;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
};
export type UserRow = {
  id: string;
  school_id: string | null;
  role: Role;
  full_name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
};
export type StudentRow = {
  id: string;
  school_id: string;
  full_name: string;
  admission_no: string;
  class_name: string;
  stream: string | null;
  created_at: string;
};
export type ParentStudentLinkRow = {
  id: string;
  parent_id: string;
  student_id: string;
  relationship: Relationship;
  consent_given: boolean;
  consent_date: string | null;
};
export type AttendanceRow = {
  id: string;
  student_id: string;
  teacher_id: string | null;
  date: string;
  status: AttendanceStatus;
  notes: string | null;
  created_at: string;
};
export type BehaviorLogRow = {
  id: string;
  student_id: string;
  teacher_id: string | null;
  tag: string;
  severity: Severity;
  notes: string | null;
  created_at: string;
};
export type GradeRow = {
  id: string;
  student_id: string;
  term_id: string;
  subject: string;
  assessment_name: string;
  score: number;
  max_score: number;
  teacher_id: string | null;
  created_at: string;
};
export type SmsLogRow = {
  id: string;
  school_id: string | null;
  student_id: string | null;
  recipient_phone: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  error: string | null;
  sent_at: string | null;
  created_at: string;
};

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type TableDef<Row, Insert> = { Row: Row; Insert: Insert; Update: Partial<Insert>; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      schools: TableDef<SchoolRow, Optional<SchoolRow, 'id' | 'created_at'>>;
      academic_terms: TableDef<AcademicTermRow, Optional<AcademicTermRow, 'id'>>;
      users: TableDef<UserRow, Optional<UserRow, 'school_id' | 'phone' | 'email' | 'created_at'>>;
      students: TableDef<StudentRow, Optional<StudentRow, 'id' | 'stream' | 'created_at'>>;
      parent_student_links: TableDef<
        ParentStudentLinkRow,
        Optional<ParentStudentLinkRow, 'id' | 'consent_given' | 'consent_date'>
      >;
      attendance: TableDef<AttendanceRow, Optional<AttendanceRow, 'id' | 'teacher_id' | 'notes' | 'created_at'>>;
      behavior_logs: TableDef<BehaviorLogRow, Optional<BehaviorLogRow, 'id' | 'teacher_id' | 'notes' | 'created_at'>>;
      grades: TableDef<GradeRow, Optional<GradeRow, 'id' | 'teacher_id' | 'created_at'>>;
      sms_logs: TableDef<
        SmsLogRow,
        Optional<SmsLogRow, 'id' | 'school_id' | 'student_id' | 'status' | 'error' | 'sent_at' | 'created_at'>
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      get_user_role: { Args: Record<PropertyKey, never>; Returns: Role | null };
      get_user_school_id: { Args: Record<PropertyKey, never>; Returns: string | null };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
