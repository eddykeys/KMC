# Phase 3 Release Checklist

## Scope

Phase 3 focuses on stabilization, UAT readiness, and production confidence.

## Environment Readiness

- [ ] `DATABASE_URL` is configured for the target environment.
- [ ] Prisma migrations are applied.
- [ ] `npm run verify:phase2` passes.
- [ ] UAT seed executed with `npm run seed:uat` on test database only.

## Critical Journey Validation

- [ ] Admin can create, edit, and delete teacher records.
- [ ] Teacher can create exam, add questions, publish exam, and grade submissions.
- [ ] Student can open published exam, submit answers, and see updated results.
- [ ] Proctoring violations are visible in teacher submission analytics.

## Data Integrity Checks

- [ ] No duplicate class names per school.
- [ ] Teacher-subject assignments exist for active timetable subjects.
- [ ] Published exams include at least one question.
- [ ] Result publishing updates `results` and report-card views.

## Operational Observability

- [ ] Action telemetry logs are visible for admin provisioning actions.
- [ ] Action telemetry logs are visible for teacher exam lifecycle actions.
- [ ] Action telemetry logs are visible for student exam submission actions.
- [ ] Error logs include action name and target identifiers.

## Sign-off

- [ ] Product owner sign-off
- [ ] QA sign-off
- [ ] Deployment window approved
