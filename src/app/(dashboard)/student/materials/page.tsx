import Link from "next/link";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default async function StudentMaterialsPage() {
  const session = await auth();
  const user = session?.user as SessionUser;

  const lessonPlans = await prisma.lessonPlan.findMany({
    where: {
      subject: {
        class: {
          students: {
            some: {
              id: user.studentId,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
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
        },
      },
      aiAssets: {
        select: {
          id: true,
        },
      },
    },
  });

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Learning materials"
        title="Class lesson materials"
        description="Browse lesson plans and AI-enhanced study assets that belong to your class."
      >
        {lessonPlans.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No lesson materials are available for your class yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {lessonPlans.map((plan) => (
              <article
                key={plan.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{plan.title}</p>
                    <p className="mt-1 text-sm text-stone-400">
                      {plan.subject.name} • {plan.subject.class.name}
                    </p>
                  </div>
                  <div className="text-right text-xs uppercase tracking-[0.18em] text-stone-500">
                    <p>{plan.term.name}</p>
                    <p>{formatDate(plan.createdAt)}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                  <span>{plan.topic}</span>
                  <span>{plan.aiAssets.length} AI asset(s)</span>
                  <span>{plan.isAIGenerated ? "AI enhanced" : "Teacher drafted"}</span>
                </div>
                <div className="mt-4">
                  <Link
                    href={`/student/materials/${plan.id}`}
                    className="inline-flex items-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/20"
                  >
                    Open material
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
