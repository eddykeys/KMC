import Link from "next/link";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { TeacherExamForm } from "@/components/dashboard/teacher-exam-form";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default async function TeacherExamsPage() {
  const session = await auth();
  const user = session?.user as SessionUser;

  const [assignments, terms, exams] = await Promise.all([
    prisma.subjectTeacher.findMany({
      where: { teacherId: user.teacherId },
      orderBy: [{ subject: { name: "asc" } }],
      select: {
        subject: {
          select: {
            id: true,
            name: true,
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.term.findMany({
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
    prisma.exam.findMany({
      where: { teacherId: user.teacherId },
      orderBy: [{ createdAt: "desc" }],
      include: {
        subject: { select: { name: true } },
        class: { select: { name: true } },
        term: { select: { name: true } },
        _count: { select: { questions: true, submissions: true } },
      },
      take: 12,
    }),
  ]);

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Assessments"
        title="Create exams"
        description="Set up tests and exams for your assigned subjects, including timing and proctoring preferences."
      >
        <TeacherExamForm
          assignments={assignments.map((assignment) => ({
            subjectId: assignment.subject.id,
            subjectName: assignment.subject.name,
            classId: assignment.subject.class.id,
            className: assignment.subject.class.name,
          }))}
          terms={terms.map((term) => ({
            id: term.id,
            name: term.name,
            sessionName: term.session.name,
          }))}
        />
      </DashboardPanel>

      <DashboardPanel
        eyebrow="Assessment records"
        title="Recent exams"
        description="Created exams appear here with readiness signals so teachers can see what still needs questions or publishing."
      >
        {exams.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No exams yet. Create your first assessment with the form above.
          </div>
        ) : (
          <div className="grid gap-3">
            {exams.map((exam) => (
              <article
                key={exam.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <p className="text-lg font-semibold text-white">{exam.title}</p>
                <p className="mt-1 text-sm text-stone-400">
                  {exam.subject.name} • {exam.class.name} • {exam.term.name}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                  <span>{exam.type}</span>
                  <span>{exam.duration} min</span>
                  <span>{exam.totalMarks} marks</span>
                  <span>{exam._count.questions} questions</span>
                  <span>{exam._count.submissions} submissions</span>
                  <span>{formatDate(exam.createdAt)}</span>
                  <span>{exam.isPublished ? "Published" : "Draft"}</span>
                </div>
                <div className="mt-4">
                  <Link
                    href={`/teacher/exams/${exam.id}`}
                    className="inline-flex items-center rounded-2xl border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-300/20"
                  >
                    Manage questions
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </DashboardPanel>
    </main>
  );
}
