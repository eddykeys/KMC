import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { AdminFeeForm } from "@/components/dashboard/admin-fee-form";
import { PaymentRecordForm } from "@/components/dashboard/payment-record-form";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatDate, formatNaira } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default async function AdminFeesPage() {
  const session = await auth();
  const user = session?.user as SessionUser;

  const [terms, fees, students, recentPayments] = await Promise.all([
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
    prisma.fee.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { createdAt: "desc" },
      include: {
        term: { select: { name: true } },
        payments: {
          select: { amount: true },
        },
      },
    }),
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
    prisma.payment.findMany({
      where: {
        fee: {
          schoolId: user.schoolId,
        },
      },
      orderBy: { paidAt: "desc" },
      take: 12,
      include: {
        fee: { select: { name: true } },
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, accessId: true } },
          },
        },
      },
    }),
  ]);

  return (
    <main className="space-y-6 py-2">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DashboardPanel
          eyebrow="Finance setup"
          title="Create fee schedules"
          description="Define fees by term and optional level so families and finance staff have a clear billing structure."
        >
          <AdminFeeForm
            terms={terms.map((term) => ({
              id: term.id,
              name: term.name,
              sessionName: term.session.name,
            }))}
          />
        </DashboardPanel>

        <DashboardPanel
          eyebrow="Collections"
          title="Record fee payments"
          description="Capture student payments against active fees and keep collection status current."
        >
          <PaymentRecordForm
            students={students.map((student) => ({
              id: student.id,
              fullName: `${student.user.firstName} ${student.user.lastName}`,
              accessId: student.user.accessId,
              className: student.class?.name ?? "No class",
            }))}
            fees={fees.map((fee) => ({
              id: fee.id,
              name: fee.name,
              amount: fee.amount,
            }))}
          />
        </DashboardPanel>
      </section>

      <DashboardPanel
        eyebrow="Fee board"
        title="Active fee definitions"
        description="Monitor how each fee is configured and how much has already been collected against it."
      >
        {fees.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No fee structures have been created for this school yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {fees.map((fee) => {
              const totalPaid = fee.payments.reduce((sum, payment) => sum + payment.amount, 0);
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
                      <p className="text-lg font-semibold text-white">{formatNaira(fee.amount)}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                        Collected {formatNaira(totalPaid)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                    {fee.dueDate ? <span>Due {formatDate(fee.dueDate)}</span> : null}
                    <span>{fee.payments.length} payment(s)</span>
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

      <DashboardPanel
        eyebrow="Recent collections"
        title="Latest payment activity"
        description="Recently captured fee payments appear here for quick reconciliation."
      >
        {recentPayments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No fee payments have been recorded yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {recentPayments.map((payment) => (
              <article
                key={payment.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">
                      {payment.student.user.firstName} {payment.student.user.lastName}
                    </p>
                    <p className="mt-1 text-sm text-stone-400">
                      {payment.fee.name} • {payment.student.user.accessId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">{formatNaira(payment.amount)}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      {payment.status}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                  {payment.method ? <span>{payment.method}</span> : null}
                  {payment.reference ? <span>{payment.reference}</span> : null}
                  {payment.paidAt ? <span>{formatDate(payment.paidAt)}</span> : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </DashboardPanel>
    </main>
  );
}
