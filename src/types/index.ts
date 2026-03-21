import { Role, Gender, SchoolCode, ClassLevel, TermName, ExamType, QuestionType, PaymentStatus, ViolationType, AttendanceStatus } from "@prisma/client";

// Re-export Prisma enums for convenience
export type { Role, Gender, SchoolCode, ClassLevel, TermName, ExamType, QuestionType, PaymentStatus, ViolationType, AttendanceStatus };

// ─────────────────── Session / Auth ───────────────────

export interface SessionUser {
  id: string;
  accessId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  role: Role;
  schoolId: string;
  schoolCode: SchoolCode;
  avatar?: string | null;
  teacherId?: string;
  studentId?: string;
  classId?: string;
}

// ─────────────────── Dashboard Stats ───────────────────

export interface AdminDashboardStats {
  totalTeachers: number;
  totalStudents: number;
  totalClasses: number;
  totalSubjects: number;
  recentRegistrations: RecentRegistration[];
  classTeacherSummary: ClassTeacherSummary[];
  announcements: AnnouncementSummary[];
}

export interface RecentRegistration {
  id: string;
  name: string;
  role: Role;
  accessId: string;
  createdAt: string;
}

export interface ClassTeacherSummary {
  classId: string;
  className: string;
  teacherName: string | null;
  totalStudents: number;
}

export interface AnnouncementSummary {
  id: string;
  title: string;
  content: string;
  priority: number;
  createdAt: string;
}

// ─────────────────── Exam Proctoring ───────────────────

export interface ProctoringConfig {
  isEnabled: boolean;
  isWebcamRequired: boolean;
  maxViolations: number;
}

export interface ProctoringState {
  isFullscreen: boolean;
  isPaused: boolean;
  isOnline: boolean;
  violationCount: number;
  violations: ProctoringViolation[];
  isAutoSubmitted: boolean;
  webcamStream: MediaStream | null;
  faceDetectionActive: boolean;
}

export interface ProctoringViolation {
  type: ViolationType;
  description: string;
  timestamp: Date;
  screenshotUrl?: string;
}

// ─────────────────── Lesson Plan AI ───────────────────

export interface AIGeneratedContent {
  notes: string;
  mcqs: AIMCQ[];
  flashcards: AIFlashcard[];
  podcastScript: string;
  writtenTest: string;
  tutorLesson: string;
  summary: string;
}

export interface AIMCQ {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface AIFlashcard {
  front: string;
  back: string;
}

// ─────────────────── API Response ───────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─────────────────── Table / Filter ───────────────────

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
