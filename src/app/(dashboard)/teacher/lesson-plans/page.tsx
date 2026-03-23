import { LessonPlanAiForm } from "@/components/dashboard/lesson-plan-ai-form";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { TeacherLessonPlanForm } from "@/components/dashboard/teacher-lesson-plan-form";
import { auth } from "@/lib/auth";
import { getLessonPlans } from "@/actions/lesson-plan-actions";
import prisma from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default async function TeacherLessonPlansPage() {
  const session = await auth();
  const user = session?.user as SessionUser;

  const [plans, subjectAssignments, terms] = await Promise.all([
    getLessonPlans({ teacherId: user.teacherId }),
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
  ]);

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Planning"
        title="Create lesson plans"
        description="Draft lesson plans for your assigned subjects and keep a clean planning record for each term."
      >
        <TeacherLessonPlanForm
          subjects={subjectAssignments.map((assignment) => ({
            id: assignment.subject.id,
            name: assignment.subject.name,
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
        eyebrow="Records"
        title="Recent lesson plans"
        description="Your latest lesson plans are listed here so you can keep track of topics, subjects, and term coverage."
      >
        {plans.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No lesson plans yet. Create your first one with the form above.
          </div>
        ) : (
          <div className="grid gap-3">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <p className="text-lg font-semibold text-white">{plan.title}</p>
                <p className="mt-1 text-sm text-stone-400">
                  {plan.subject.name} • {plan.topic}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                  <span>{formatDate(plan.createdAt)}</span>
                  <span>{plan.aiAssets.length} AI asset(s)</span>
                  {plan.subject.code ? <span>{plan.subject.code}</span> : null}
                </div>
                <div className="mt-4">
                  <LessonPlanAiForm
                    lessonPlanId={plan.id}
                    disabled={plan.aiAssets.length > 0}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </DashboardPanel>
    </main>
  );
}
