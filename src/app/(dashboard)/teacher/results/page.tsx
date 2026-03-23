import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { TeacherResultForm } from "@/components/dashboard/teacher-result-form";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default async function TeacherResultsPage() {
  const session = await auth();
  const user = session?.user as SessionUser;

  const [assignments, terms, savedResults] = await Promise.all([
    prisma.subjectTeacher.findMany({
      where: { teacherId: user.teacherId },
      orderBy: [{ subject: { class: { name: "asc" } } }, { subject: { name: "asc" } }],
      select: {
        subject: {
          select: {
            id: true,
            name: true,
            class: {
              select: {
                id: true,
                name: true,
                level: true,
                students: {
                  orderBy: [{ user: { firstName: "asc" } }, { user: { lastName: "asc" } }],
                  select: {
                    id: true,
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                        accessId: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.term.findMany({
      where: {
        session: {
          schoolId: user.schoolId,
        },
      },
      orderBy: [{ session: { startDate: "desc" } }, { startDate: "asc" }],
      select: {
        id: true,
        name: true,
        session: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.result.findMany({
      where: {
        subject: {
          teachers: {
            some: {
              teacherId: user.teacherId,
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 18,
      select: {
        id: true,
        totalScore: true,
        grade: true,
        remark: true,
        teacherComment: true,
        updatedAt: true,
        student: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                accessId: true,
              },
            },
          },
        },
        subject: {
          select: {
            name: true,
            class: {
              select: {
                name: true,
              },
            },
          },
        },
        term: {
          select: {
            name: true,
            session: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const flattenedAssignments = assignments.map((assignment) => ({
    subjectId: assignment.subject.id,
    subjectName: assignment.subject.name,
    classId: assignment.subject.class.id,
    className: assignment.subject.class.name,
    level: assignment.subject.class.level,
  }));

  const students = assignments.flatMap((assignment) =>
    assignment.subject.class.students.map((student) => ({
      id: student.id,
      fullName: `${student.user.firstName} ${student.user.lastName}`,
      accessId: student.user.accessId,
      classId: assignment.subject.class.id,
      className: assignment.subject.class.name,
    }))
  );

  const uniqueStudents = Array.from(
    new Map(students.map((student) => [student.id, student])).values()
  );

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Results"
        title="Record and update student performance"
        description="Save weighted CA and exam scores for the subjects on your teaching load, then publish structured academic performance back into the student workspace."
      >
        {flattenedAssignments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No subject assignments are tied to this teacher account yet, so result entry is not available.
          </div>
        ) : (
          <TeacherResultForm
            assignments={flattenedAssignments}
            students={uniqueStudents}
            terms={terms.map((term) => ({
              id: term.id,
              name: term.name,
              sessionName: term.session.name,
            }))}
          />
        )}
      </DashboardPanel>

      <DashboardPanel
        eyebrow="Coverage"
        title="Teaching load ready for scoring"
        description="These classes and subject assignments are available for result entry under your account."
      >
        {flattenedAssignments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No active teaching assignments are available yet.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {assignments.map((assignment) => (
              <article
                key={assignment.subject.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <p className="text-lg font-semibold text-white">{assignment.subject.name}</p>
                <p className="mt-1 text-sm text-stone-400">
                  {assignment.subject.class.name} ({assignment.subject.class.level})
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                  <span>{assignment.subject.class.students.length} student(s)</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </DashboardPanel>

      <DashboardPanel
        eyebrow="Saved records"
        title="Recent result updates"
        description="Recently saved result records appear here so teachers can confirm what has already been entered."
      >
        {savedResults.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No result records have been saved yet for your assigned subjects.
          </div>
        ) : (
          <div className="grid gap-3">
            {savedResults.map((result) => (
              <article
                key={result.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">
                      {result.student.user.firstName} {result.student.user.lastName}
                    </p>
                    <p className="mt-1 text-sm text-stone-400">
                      {result.subject.name} • {result.subject.class.name}
                    </p>
                  </div>
                  <div className="rounded-full bg-sky-300/10 px-3 py-1 text-sm font-medium text-sky-100">
                    {result.totalScore ?? 0}% • {result.grade ?? "Pending"}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                  <span>{result.student.user.accessId}</span>
                  <span>{result.term.name}</span>
                  <span>{result.term.session.name}</span>
                  <span>Updated {formatDate(result.updatedAt)}</span>
                  {result.remark ? <span>{result.remark}</span> : null}
                </div>
                {result.teacherComment ? (
                  <p className="mt-4 text-sm text-stone-300">{result.teacherComment}</p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </DashboardPanel>
    </main>
  );
}
