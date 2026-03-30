# KMC School Management System

School operations platform for Knightdale Middle College and Priscilla School.

## Current Delivery Phase

As of March 25, 2026, this repository is in **Phase 3 (Hardening and UAT Readiness)**.

### Phase status

- Complete: Admin, Teacher, and Student dashboards with role-based routes.
- Complete: Core school workflows (users, classes, subjects, schedules, announcements, exams, results, attendance, fees, report cards, analytics).
- Complete: Phase 2 closure checks (lint + smoke + journey contracts).
- In progress: Phase 3 hardening (UAT data seed, release checklist, action observability).

## Feature Modules

- Admin
  - Overview and analytics
  - Teachers, students, classes, subjects
  - Timetable scheduling
  - Announcements
  - Fee setup and payment recording
  - Report card generation and publishing
- Teacher
  - Overview and timetable view
  - Lesson plans
  - Exams (authoring, submissions, analytics)
  - Results entry
  - Attendance register
  - Weekly reports
- Student
  - Overview and timetable view
  - Exam taking and submission status
  - Results
  - Learning materials
  - Fees
  - Report cards

## Development

Run the app:

```bash
npm run dev
```

Run code quality checks:

```bash
npm run lint
```

Run smoke checks:

```bash
npm run test:smoke
```

Run journey contract checks for critical school workflows:

```bash
npm run test:journeys
```

Run full Phase 2 verification (lint + smoke):

```bash
npm run verify:phase2
```

Seed UAT dataset on a test database:

```bash
npm run seed:uat
```

Configure centralized monitoring export (optional):

```bash
# OpenTelemetry logs endpoint (preferred)
OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=https://otel-collector.example.com/v1/logs

# Or set base OTLP endpoint and Next.js app will append /v1/logs
OTEL_EXPORTER_OTLP_ENDPOINT=https://otel-collector.example.com

# Optional OTLP headers in key=value comma format
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Bearer your-token

# Optional service name override
OTEL_SERVICE_NAME=kmc-app

# Optional fallback webhook for raw telemetry payloads
MONITORING_WEBHOOK_URL=https://monitoring.example.com/ingest
```

## Immediate Next Phase Focus

- Execute full QA walkthrough using the UAT seeded accounts.
- Expand runtime integration tests around server actions and database transitions.
- Add centralized monitoring export (OpenTelemetry/Sentry) on top of action telemetry.
