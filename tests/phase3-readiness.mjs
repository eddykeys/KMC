import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

function read(file) {
  return readFileSync(file, "utf8");
}

assert.equal(existsSync("prisma/seed-uat.mjs"), true, "Missing UAT seed script.");
assert.equal(
  existsSync("docs/phase-3-release-checklist.md"),
  true,
  "Missing Phase 3 release checklist."
);
assert.equal(
  existsSync("src/lib/action-telemetry.ts"),
  true,
  "Missing action telemetry helper."
);

const adminTeacherActions = read("src/app/(dashboard)/admin/teachers/actions.ts");
const teacherExamActions = read("src/app/(dashboard)/teacher/exams/actions.ts");
const studentExamActions = read("src/app/(dashboard)/student/exams/actions.ts");

assert.match(
  adminTeacherActions,
  /logAction(Success|Failure)/,
  "Admin teacher actions should emit telemetry."
);
assert.match(
  teacherExamActions,
  /logAction(Success|Failure)/,
  "Teacher exam actions should emit telemetry."
);
assert.match(
  studentExamActions,
  /logAction(Success|Failure)/,
  "Student exam actions should emit telemetry."
);

console.log("Phase 3 readiness checks passed.");
