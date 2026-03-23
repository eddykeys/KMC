import Link from "next/link";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import {
  deleteReportCardFormAction,
  toggleReportCardPublishFormAction,
} from "@/app/(dashboard)/admin/report-cards/actions";
import { ReportCardGenerateForm } from "@/components/dashboard/report-card-generate-form";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default async function AdminReportCardsPage() {
  const session = await auth();
  const user = session?.user as SessionUser;

  const [students, terms, reportCards] = await Promise.all([
    prisma.student.findMany({
      where: {
        user: {
          schoolId: user.schoolId,
        },
      },
      orderBy: [{ user: { firstName: "asc" } }, { user: { lastName: "asc" } }],
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            accessId: true,
          },
        },
        class: {
          select: { name: true },
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
        session: { select: { name: true } },
      },
    }),
    prisma.reportCard.findMany({
      where: {
        student: {
          user: {
            schoolId: user.schoolId,
          },
        },
      },
      orderBy: { generatedAt: "desc" },
      take: 18,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                accessId: true,
              },
            },
            class: {
              select: { name: true },
            },
          },
        },
        term: {
          include: {
            session: {
              select: { name: true },
            },
          },
        },
      },
    }),
  ]);

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Academic reporting"
        title="Generate report cards"
        description="Compile published term results into student report cards with comments and ranking details."
      >
        <ReportCardGenerateForm
          students={students.map((student) => ({
            id: student.id,
            fullName: `${student.user.firstName} ${student.user.lastName}`,
            accessId: student.user.accessId,
            className: student.class?.name ?? "No class",
          }))}
          terms={terms.map((term) => ({
            id: term.id,
            name: term.name,
            sessionName: term.session.name,
          }))}
        />
      </DashboardPanel>

      <DashboardPanel
        eyebrow="Published cards"
        title="Recent report cards"
        description="Open generated report cards to print or export them for parents, students, and school records."
      >
        {reportCards.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No report cards have been generated yet.
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
                      {card.student.user.firstName} {card.student.user.lastName}
                    </p>
                    <p className="mt-1 text-sm text-stone-400">
                      {card.student.class?.name ?? "No class"} • {card.student.user.accessId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      {card.averageScore !== null ? card.averageScore.toFixed(2) : "-"}%
                    </p>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      {card.isPublished ? "Published" : "Draft"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                  <span>{card.term.name}</span>
                  <span>{card.term.session.name}</span>
                  <span>Generated {formatDate(card.generatedAt)}</span>
                </div>
                <div className="mt-4">
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/admin/report-cards/${card.id}`}
                      className="inline-flex items-center rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-300/20"
                    >
                      Open report card
                    </Link>
                    <form action={toggleReportCardPublishFormAction}>
                      <input type="hidden" name="reportCardId" value={card.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center rounded-2xl border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-300/20"
                      >
                        {card.isPublished ? "Unpublish" : "Publish"}
                      </button>
                    </form>
                    <form action={deleteReportCardFormAction}>
                      <input type="hidden" name="reportCardId" value={card.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-400/20"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </DashboardPanel>
    </main>
  );
}
