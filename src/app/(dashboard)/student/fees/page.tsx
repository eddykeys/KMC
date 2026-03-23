import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatDate, formatNaira } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default async function StudentFeesPage() {
  const session = await auth();
  const user = session?.user as SessionUser;

  const student = await prisma.student.findUnique({
    where: { id: user.studentId },
    select: {
      class: {
        select: {
          level: true,
        },
      },
      payments: {
        select: {
          feeId: true,
          amount: true,
          status: true,
        },
      },
    },
  });

  const fees = await prisma.fee.findMany({
    where: {
      schoolId: user.schoolId,
      OR: [{ level: null }, { level: student?.class?.level ?? undefined }],
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      term: { select: { name: true } },
    },
  });

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Fees"
        title="Your fee schedule"
        description="Review assigned fee items, how much has been paid, and what is still outstanding."
      >
        {fees.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No fee items are currently assigned to your profile.
          </div>
        ) : (
          <div className="grid gap-3">
            {fees.map((fee) => {
              const payments = student?.payments.filter((payment) => payment.feeId === fee.id) ?? [];
              const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
              const balance = Math.max(fee.amount - totalPaid, 0);

              return (
                <article
                  key={fee.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{fee.name}</p>
                      <p className="mt-1 text-sm text-stone-400">
                        {fee.term.name} {fee.level ? `• ${fee.level}` : "• All levels"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{formatNaira(fee.amount)}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                        Balance {formatNaira(balance)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                    <span>Paid {formatNaira(totalPaid)}</span>
                    {fee.dueDate ? <span>Due {formatDate(fee.dueDate)}</span> : null}
                    {payments[payments.length - 1]?.status ? (
                      <span>{payments[payments.length - 1].status}</span>
                    ) : (
                      <span>PENDING</span>
                    )}
                  </div>
                  {fee.description ? (
                    <p className="mt-4 text-sm text-stone-300">{fee.description}</p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </DashboardPanel>
    </main>
  );
}
