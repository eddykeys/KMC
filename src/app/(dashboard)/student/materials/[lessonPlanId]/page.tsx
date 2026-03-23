import { notFound } from "next/navigation";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import type { SessionUser } from "@/types";

function parseJsonArray(content: string) {
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default async function StudentMaterialDetailPage({
  params,
}: {
  params: Promise<{ lessonPlanId: string }>;
}) {
  const { lessonPlanId } = await params;
  const session = await auth();
  const user = session?.user as SessionUser;

  const lessonPlan = await prisma.lessonPlan.findFirst({
    where: {
      id: lessonPlanId,
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
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!lessonPlan) {
    notFound();
  }

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Lesson material"
        title={lessonPlan.title}
        description={`${lessonPlan.subject.name} for ${lessonPlan.subject.class.name} • ${lessonPlan.term.name}`}
      >
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
          <span>{lessonPlan.topic}</span>
          <span>{formatDate(lessonPlan.createdAt)}</span>
          <span>{lessonPlan.isAIGenerated ? "AI enhanced" : "Teacher drafted"}</span>
        </div>

        <div className="mt-6 grid gap-6">
          {lessonPlan.objectives ? (
            <section>
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Objectives</p>
              <div className="mt-3 whitespace-pre-line rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-stone-200">
                {lessonPlan.objectives}
              </div>
            </section>
          ) : null}

          {lessonPlan.content ? (
            <section>
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Lesson content</p>
              <div className="mt-3 whitespace-pre-line rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-stone-200">
                {lessonPlan.content}
              </div>
            </section>
          ) : null}

          {lessonPlan.resources ? (
            <section>
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Resources</p>
              <div className="mt-3 whitespace-pre-line rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-stone-200">
                {lessonPlan.resources}
              </div>
            </section>
          ) : null}
        </div>
      </DashboardPanel>

      <DashboardPanel
        eyebrow="AI study assets"
        title="Supplementary materials"
        description="Teacher-generated and AI-enhanced study material for deeper revision."
      >
        {lessonPlan.aiAssets.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No AI assets have been generated for this lesson plan yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {lessonPlan.aiAssets.map((asset) => {
              const items = parseJsonArray(asset.content);

              return (
                <article
                  key={asset.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100">
                    {asset.type.replaceAll("_", " ")}
                  </p>

                  {asset.type === "MCQ" && items.length > 0 ? (
                    <div className="mt-4 grid gap-4">
                      {items.map((item, index) => (
                        <div
                          key={`${asset.id}-${index}`}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                        >
                          <p className="font-medium text-white">{item.question}</p>
                          {Array.isArray(item.options) ? (
                            <div className="mt-3 grid gap-2 text-sm text-stone-300">
                              {item.options.map((option: string) => (
                                <div key={option}>{option}</div>
                              ))}
                            </div>
                          ) : null}
                          <p className="mt-3 text-sm text-emerald-200">
                            Answer: {item.correctAnswer}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : asset.type === "FLASHCARDS" && items.length > 0 ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {items.map((item, index) => (
                        <div
                          key={`${asset.id}-${index}`}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                        >
                          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Front</p>
                          <p className="mt-2 font-medium text-white">{item.front}</p>
                          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-stone-500">Back</p>
                          <p className="mt-2 text-sm text-stone-300">{item.back}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 whitespace-pre-line rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-stone-200">
                      {asset.content}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </DashboardPanel>
    </main>
  );
}
