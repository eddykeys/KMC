import assert from "node:assert/strict";
import { existsSync } from "node:fs";

const requiredRouteFiles = [
  "src/app/(dashboard)/admin/page.tsx",
  "src/app/(dashboard)/admin/analytics/page.tsx",
  "src/app/(dashboard)/admin/teachers/page.tsx",
  "src/app/(dashboard)/admin/students/page.tsx",
  "src/app/(dashboard)/admin/classes/page.tsx",
  "src/app/(dashboard)/admin/subjects/page.tsx",
  "src/app/(dashboard)/admin/schedules/page.tsx",
  "src/app/(dashboard)/admin/announcements/page.tsx",
  "src/app/(dashboard)/admin/fees/page.tsx",
  "src/app/(dashboard)/admin/report-cards/page.tsx",
  "src/app/(dashboard)/teacher/page.tsx",
  "src/app/(dashboard)/teacher/lesson-plans/page.tsx",
  "src/app/(dashboard)/teacher/exams/page.tsx",
  "src/app/(dashboard)/teacher/results/page.tsx",
  "src/app/(dashboard)/teacher/attendance/page.tsx",
  "src/app/(dashboard)/teacher/weekly-reports/page.tsx",
  "src/app/(dashboard)/student/page.tsx",
  "src/app/(dashboard)/student/exams/page.tsx",
  "src/app/(dashboard)/student/results/page.tsx",
  "src/app/(dashboard)/student/materials/page.tsx",
  "src/app/(dashboard)/student/fees/page.tsx",
  "src/app/(dashboard)/student/report-cards/page.tsx",
];

for (const file of requiredRouteFiles) {
  assert.equal(existsSync(file), true, `Missing expected route file: ${file}`);
}

assert.equal(existsSync("src/hooks/useAuth.ts"), true, "Missing useAuth hook file");
assert.equal(existsSync("README.md"), true, "Missing README.md");

console.log("Smoke checks passed.");
