import Link from "next/link";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default async function StudentReportCardsPage() {
  const session = await auth();
  const user = session?.user as SessionUser;

  const reportCards = await prisma.reportCard.findMany({
    where: {
      studentId: user.studentId,
      isPublished: true,
    },
    orderBy: { generatedAt: "desc" },
    include: {
      term: {
        include: {
          session: {
            select: { name: true },
          },
        },
      },
    },
  });

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Report cards"
        title="Your generated report cards"
        description="Open report cards to review term performance and export a PDF copy when needed."
      >
        {reportCards.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No published report cards are available on your profile yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {reportCards.map((card) => (
              <article
                key={card.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">
                      {card.term.name} • {card.term.session.name}
                    </p>
                    <p className="mt-1 text-sm text-stone-400">
                      Generated {formatDate(card.generatedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      {card.averageScore !== null ? card.averageScore.toFixed(2) : "-"}%
                    </p>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      {card.position && card.outOf ? `${card.position}/${card.outOf}` : "Rank pending"}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    href={`/student/report-cards/${card.id}`}
                    className="inline-flex items-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/20"
                  >
                    Open report card
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
