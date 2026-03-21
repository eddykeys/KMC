import { z } from "zod";

// ─────────────────── Common ───────────────────

export const genderSchema = z.enum(["MALE", "FEMALE"]);
export const roleSchema = z.enum(["ADMIN", "TEACHER", "STUDENT"]);
export const schoolCodeSchema = z.enum(["KMC", "PRS"]);
export const classLevelSchema = z.enum(["JSS1", "JSS2", "JSS3", "SSS1", "SSS2", "SSS3"]);
export const termNameSchema = z.enum(["FIRST", "SECOND", "THIRD"]);
export const examTypeSchema = z.enum(["MIDTERM", "CUSTOM_TEST", "EXAM", "CBT"]);
export const questionTypeSchema = z.enum(["MCQ", "WRITTEN", "TRUE_FALSE", "FILL_IN_THE_BLANK"]);

// ─────────────────── Auth ───────────────────

export const loginSchema = z.object({
  accessId: z
    .string()
    .min(1, "Access ID is required")
    .regex(/^(KMC|PRS)-[A-Z0-9]{6}$/, "Invalid Access ID format"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─────────────────── Student ───────────────────

export const createStudentSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  middleName: z.string().max(50).optional(),
  gender: genderSchema,
  dateOfBirth: z.string().optional(),
  address: z.string().max(200).optional(),
  parentName: z.string().max(100).optional(),
  parentEmail: z.string().email("Invalid parent email").optional().or(z.literal("")),
  parentPhone: z.string().max(20).optional(),
  classId: z.string().min(1, "Class is required"),
  schoolCode: schoolCodeSchema,
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const bulkStudentCSVSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  gender: genderSchema,
  classId: z.string().min(1),
  parentEmail: z.string().email().optional().or(z.literal("")),
  parentPhone: z.string().optional(),
});

// ─────────────────── Teacher ───────────────────

export const createTeacherSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  middleName: z.string().max(50).optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  gender: genderSchema,
  phone: z.string().max(20).optional(),
  qualification: z.string().max(100).optional(),
  specialization: z.string().max(100).optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().max(200).optional(),
  schoolCode: schoolCodeSchema,
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;

// ─────────────────── Class ───────────────────

export const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required").max(50),
  level: classLevelSchema,
  schoolId: z.string().min(1),
  classTeacherId: z.string().optional(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;

// ─────────────────── Subject ───────────────────

export const createSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required").max(100),
  code: z.string().max(20).optional(),
  classId: z.string().min(1, "Class is required"),
  schoolId: z.string().min(1),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;

// ─────────────────── Exam ───────────────────

export const createExamSchema = z.object({
  title: z.string().min(1, "Exam title is required").max(200),
  type: examTypeSchema,
  subjectId: z.string().min(1),
  classId: z.string().min(1),
  termId: z.string().min(1),
  duration: z.number().int().min(1, "Duration must be at least 1 minute"),
  totalMarks: z.number().int().min(1),
  passingMarks: z.number().int().optional(),
  instructions: z.string().optional(),
  isProctoringEnabled: z.boolean().default(false),
  isWebcamRequired: z.boolean().default(false),
  maxViolations: z.number().int().default(3),
  shuffleQuestions: z.boolean().default(true),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;

export const createQuestionSchema = z.object({
  examId: z.string().min(1),
  questionText: z.string().min(1, "Question is required"),
  questionType: questionTypeSchema,
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  marks: z.number().int().default(1),
  order: z.number().int(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

// ─────────────────── Result ───────────────────

export const updateResultSchema = z.object({
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  termId: z.string().min(1),
  firstCA: z.number().min(0).max(100).optional(),
  secondCA: z.number().min(0).max(100).optional(),
  midTermTest: z.number().min(0).max(100).optional(),
  assignment: z.number().min(0).max(100).optional(),
  project: z.number().min(0).max(100).optional(),
  examScore: z.number().min(0).max(100).optional(),
  teacherComment: z.string().optional(),
});

export type UpdateResultInput = z.infer<typeof updateResultSchema>;

// ─────────────────── Fee ───────────────────

export const createFeeSchema = z.object({
  name: z.string().min(1, "Fee name is required"),
  amount: z.number().min(0, "Amount must be positive"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  level: classLevelSchema.optional(),
  schoolId: z.string().min(1),
  termId: z.string().min(1),
});

export type CreateFeeInput = z.infer<typeof createFeeSchema>;

// ─────────────────── Lesson Plan ───────────────────

export const createLessonPlanSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  topic: z.string().min(1, "Topic is required").max(200),
  objectives: z.string().optional(),
  content: z.string().optional(),
  duration: z.string().optional(),
  resources: z.string().optional(),
  subjectId: z.string().min(1),
  termId: z.string().min(1),
});

export type CreateLessonPlanInput = z.infer<typeof createLessonPlanSchema>;

// ─────────────────── Announcement ───────────────────

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required"),
  priority: z.number().int().min(0).max(2).default(0),
  classId: z.string().optional(),
  schoolId: z.string().min(1),
  expiresAt: z.string().optional(),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

// ─────────────────── Attendance ───────────────────

export const markAttendanceSchema = z.object({
  date: z.string().min(1),
  records: z.array(
    z.object({
      studentId: z.string().min(1),
      status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
      note: z.string().optional(),
    })
  ),
  classId: z.string().min(1),
  termId: z.string().min(1),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;

// ─────────────────── AI Lesson Plan Generation ───────────────────

export const aiLessonPlanSchema = z.object({
  subject: z.string().min(1),
  topic: z.string().min(1),
  classLevel: classLevelSchema,
  objectives: z.string().optional(),
  duration: z.string().optional(),
});

export type AILessonPlanInput = z.infer<typeof aiLessonPlanSchema>;
