import type {
  ATTENDANCE_STATUS,
  BEHAVIOR_TAGS,
  RELATIONSHIPS,
  ROLES,
  SEVERITIES,
} from '@/lib/constants';

/** App-wide shared types, derived from lib/constants.ts so they never drift. */
export type Role = (typeof ROLES)[number];
export type AttendanceStatus = keyof typeof ATTENDANCE_STATUS;
export type BehaviorTag = (typeof BEHAVIOR_TAGS)[number]['value'];
export type Severity = (typeof SEVERITIES)[number];
export type Relationship = (typeof RELATIONSHIPS)[number];

/** Minimal student shape used by teacher UI and the offline cache. */
export type StudentLite = {
  id: string;
  full_name: string;
  admission_no: string;
};

/** One item in the parent's Pulse Feed. */
export type PulseEvent = {
  id: string;
  kind: 'attendance' | 'behavior' | 'grade';
  at: string;
  title: string;
  detail: string;
  tone: 'success' | 'warning' | 'danger' | 'info';
};
