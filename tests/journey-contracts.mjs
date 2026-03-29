import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(file) {
  return readFileSync(file, "utf8");
}

function expectIncludes(content, needle, message) {
  assert.equal(
    content.includes(needle),
    true,
    `${message}\nExpected to find: ${needle}`
  );
}

function expectRegex(content, regex, message) {
  assert.match(content, regex, message);
}

function checkAdminProvisioningJourney() {
  const adminTeacherActions = read("src/app/(dashboard)/admin/teachers/actions.ts");
  const userActions = read("src/actions/user-actions.ts");

  expectIncludes(
    adminTeacherActions,
    "export async function createTeacherFormAction",
    "Admin teacher creation action should exist."
  );
  expectIncludes(
    adminTeacherActions,
    "user.role !== \"ADMIN\"",
    "Admin teacher action should enforce ADMIN role."
  );
  expectIncludes(
    adminTeacherActions,
    "createTeacher(parsed.data)",
    "Admin teacher action should call shared createTeacher service."
  );
  expectIncludes(
    adminTeacherActions,
    "revalidatePath(\"/admin/teachers\")",
    "Admin teacher action should revalidate teachers dashboard route."
  );
  expectIncludes(
    adminTeacherActions,
    "export async function deleteTeacherFormAction",
    "Admin teacher delete action should exist."
  );

  expectIncludes(
    userActions,
    "export async function createTeacher",
    "Shared createTeacher service should exist."
  );
  expectIncludes(
    userActions,
    "export async function updateTeacher",
    "Shared updateTeacher service should exist."
  );
  expectIncludes(
    userActions,
    "export async function deleteTeacher",
    "Shared deleteTeacher service should exist."
  );
  expectIncludes(
    userActions,
    "role: \"TEACHER\"",
    "Teacher provisioning should persist TEACHER role."
  );
}

function checkTeacherExamJourney() {
  const teacherExamActions = read("src/app/(dashboard)/teacher/exams/actions.ts");
  const examActions = read("src/app/(dashboard)/teacher/exams/[examId]/actions.ts");
  const submissionsActions = read("src/app/(dashboard)/teacher/exams/[examId]/submissions/actions.ts");
  const gradingActions = read(
    "src/app/(dashboard)/teacher/exams/[examId]/submissions/[submissionId]/actions.ts"
  );

  expectIncludes(
    teacherExamActions,
    "export async function createTeacherExamFormAction",
    "Teacher exam creation action should exist."
  );
  expectIncludes(
    teacherExamActions,
    "user.role !== \"TEACHER\"",
    "Teacher exam creation should enforce TEACHER role."
  );
  expectIncludes(
    teacherExamActions,
    "await prisma.exam.create",
    "Teacher exam creation should persist exam records."
  );
  expectIncludes(
    teacherExamActions,
    "revalidatePath(\"/teacher/exams\")",
    "Teacher exam creation should revalidate exam listing."
  );

  expectIncludes(
    examActions,
    "export async function createExamQuestionFormAction",
    "Teacher question creation action should exist."
  );
  expectIncludes(
    examActions,
    "export async function toggleExamPublishFormAction",
    "Teacher exam publish toggle action should exist."
  );
  expectIncludes(
    examActions,
    "revalidatePath(\"/student\")",
    "Publishing exams should refresh student view."
  );

  expectIncludes(
    gradingActions,
    "export async function gradeSubmissionFormAction",
    "Teacher grading action should exist."
  );
  expectIncludes(
    gradingActions,
    "revalidatePath(\"/student/results\")",
    "Grading should refresh student results."
  );

  expectIncludes(
    submissionsActions,
    "export async function publishExamResultsFormAction",
    "Teacher result publishing action should exist."
  );
  expectIncludes(
    submissionsActions,
    "await prisma.result.upsert",
    "Result publishing should upsert term result records."
  );
  expectIncludes(
    submissionsActions,
    "revalidatePath(\"/student/report-cards\")",
    "Result publishing should refresh report card screens."
  );
}

function checkStudentExamJourney() {
  const studentExamActions = read("src/app/(dashboard)/student/exams/actions.ts");
  const examProctoringActions = read("src/actions/exam-actions.ts");
  const examRunner = read("src/components/dashboard/student-exam-runner.tsx");

  expectIncludes(
    studentExamActions,
    "export async function ensureExamSubmission",
    "Student flow should ensure submission record creation."
  );
  expectIncludes(
    studentExamActions,
    "export async function submitStudentExamFormAction",
    "Student exam submission action should exist."
  );
  expectIncludes(
    studentExamActions,
    "user.role !== \"STUDENT\"",
    "Student exam actions should enforce STUDENT role."
  );
  expectIncludes(
    studentExamActions,
    "await prisma.examAnswer.upsert",
    "Student submission should persist answers."
  );
  expectRegex(
    studentExamActions,
    /revalidatePath\(\"\/student\/exams\"\)/,
    "Student submission should revalidate exam listing."
  );

  expectIncludes(
    examRunner,
    "useExamProctoring",
    "Student exam runner should wire client proctoring hook."
  );
  expectIncludes(
    examRunner,
    "onAutoSubmit",
    "Student exam runner should support proctoring auto-submit."
  );

  expectIncludes(
    examProctoringActions,
    "export async function logViolation",
    "Proctoring violation logging action should exist."
  );
  expectIncludes(
    examProctoringActions,
    "isAutoSubmitted: true",
    "Violation threshold should trigger server-side auto-submit flag."
  );
}

checkAdminProvisioningJourney();
checkTeacherExamJourney();
checkStudentExamJourney();

console.log("Journey contract checks passed.");
