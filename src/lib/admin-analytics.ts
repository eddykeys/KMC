import { cache } from "react";
import prisma from "@/lib/prisma";

export const getAdminAnalyticsData = cache(async (schoolId: string) => {
  const [students, fees, payments, results, reportCards, attendanceRecords] = await Promise.all([
    prisma.student.findMany({
      where: {
        user: {
          schoolId,
        },
      },
      select: {
        id: true,
        class: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    }),
    prisma.fee.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        amount: true,
        level: true,
      },
    }),
    prisma.payment.findMany({
      where: {
        fee: {
          schoolId,
        },
      },
      orderBy: { paidAt: "desc" },
      take: 8,
      select: {
        id: true,
        amount: true,
        status: true,
        paidAt: true,
        fee: {
          select: {
            name: true,
          },
        },
        student: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    }),
    prisma.result.findMany({
      where: {
        subject: {
          schoolId,
        },
      },
      select: {
        totalScore: true,
        subject: {
          select: {
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
    prisma.reportCard.findMany({
      where: {
        student: {
          user: {
            schoolId,
          },
        },
      },
      orderBy: { generatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        averageScore: true,
        isPublished: true,
        generatedAt: true,
        term: {
          select: {
            name: true,
          },
        },
        student: {
          select: {
            class: {
              select: {
                name: true,
              },
            },
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    }),
    prisma.attendance.findMany({
      where: {
        class: {
          schoolId,
        },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 240,
      select: {
        id: true,
        date: true,
        status: true,
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ]);

  const totalCollected = payments.reduce((sum, payment) => sum + payment.amount, 0);

  const totalBillable = fees.reduce((sum, fee) => {
    const eligibleStudents = students.filter((student) =>
      fee.level ? student.class?.level === fee.level : true
    ).length;
    return sum + fee.amount * eligibleStudents;
  }, 0);

  const outstandingBalance = Math.max(totalBillable - totalCollected, 0);

  const averageResultScore =
    results.length > 0
      ? results.reduce((sum, result) => sum + (result.totalScore ?? 0), 0) / results.length
      : 0;

  const classPerformanceMap = new Map<string, { className: string; scores: number[] }>();
  for (const result of results) {
    const classId = result.subject.class.id;
    const className = result.subject.class.name;
    const current = classPerformanceMap.get(classId) ?? { className, scores: [] };
    current.scores.push(result.totalScore ?? 0);
    classPerformanceMap.set(classId, current);
  }

  const classPerformance = Array.from(classPerformanceMap.entries())
    .map(([classId, value]) => ({
      classId,
      className: value.className,
      averageScore:
        value.scores.length > 0
          ? value.scores.reduce((sum, score) => sum + score, 0) / value.scores.length
          : 0,
    }))
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 6);

  const attendanceSummaryMap = new Map<
    string,
    {
      classId: string;
      className: string;
      dateKey: string;
      present: number;
      absent: number;
      late: number;
      excused: number;
    }
  >();

  for (const record of attendanceRecords) {
    const dateKey = record.date.toISOString().slice(0, 10);
    const existing = attendanceSummaryMap.get(record.class.id);

    if (existing && existing.dateKey !== dateKey) {
      continue;
    }

    const summary = existing ?? {
      classId: record.class.id,
      className: record.class.name,
      dateKey,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };

    if (record.status === "PRESENT") summary.present += 1;
    if (record.status === "ABSENT") summary.absent += 1;
    if (record.status === "LATE") summary.late += 1;
    if (record.status === "EXCUSED") summary.excused += 1;

    attendanceSummaryMap.set(record.class.id, summary);
  }

  const attendanceByClass = Array.from(attendanceSummaryMap.values()).slice(0, 6);

  return {
    quickStats: [
      {
        label: "Collected Fees",
        value: totalCollected,
        helper: "Total payment value recorded across fee collections.",
      },
      {
        label: "Outstanding Balance",
        value: outstandingBalance,
        helper: "Estimated unpaid balance across configured school fees.",
      },
      {
        label: "Avg Result Score",
        value: averageResultScore,
        helper: "Average academic score across recorded result entries.",
      },
      {
        label: "Report Cards",
        value: reportCards.filter((card) => card.isPublished).length,
        helper: "Published report cards across recent academic reporting.",
      },
    ],
    attendanceByClass,
    classPerformance,
    recentPayments: payments,
    recentReportCards: reportCards,
  };
});
