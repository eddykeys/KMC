import { notFound } from "next/navigation";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { ReportCardView } from "@/components/dashboard/report-card-view";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { SessionUser } from "@/types";

export default async function StudentReportCardDetailPage({
  params,
}: {
  params: Promise<{ reportCardId: string }>;
}) {
  const { reportCardId } = await params;
  const session = await auth();
  const user = session?.user as SessionUser;

  const reportCard = await prisma.reportCard.findFirst({
    where: {
      id: reportCardId,
      studentId: user.studentId,
      isPublished: true,
    },
    include: {
      student: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              accessId: true,
              school: {
                select: { name: true },
              },
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
  });

  if (!reportCard) {
    notFound();
  }

  const results = await prisma.result.findMany({
    where: {
      studentId: reportCard.studentId,
      termId: reportCard.termId,
    },
    orderBy: { subject: { name: "asc" } },
    select: {
      firstCA: true,
      secondCA: true,
      midTermTest: true,
      assignment: true,
      project: true,
      examScore: true,
      totalScore: true,
      grade: true,
      remark: true,
      subject: {
        select: { name: true },
      },
    },
  });

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Report card"
        title="Print and export"
        description="Print this report card or export a PDF copy for home records."
      >
        <ReportCardView
          schoolName={reportCard.student.user.school.name}
          studentName={`${reportCard.student.user.firstName} ${reportCard.student.user.lastName}`}
          accessId={reportCard.student.user.accessId}
          className={reportCard.student.class?.name ?? "No class"}
          termName={reportCard.term.name}
          sessionName={reportCard.term.session.name}
          generatedAt={reportCard.generatedAt.toISOString()}
          averageScore={reportCard.averageScore}
          totalScore={reportCard.totalScore}
          position={reportCard.position}
          outOf={reportCard.outOf}
          classTeacherComment={reportCard.classTeacherComment}
          principalComment={reportCard.principalComment}
          results={results.map((result) => ({
            subjectName: result.subject.name,
            firstCA: result.firstCA,
            secondCA: result.secondCA,
            midTermTest: result.midTermTest,
            assignment: result.assignment,
            project: result.project,
            examScore: result.examScore,
            totalScore: result.totalScore,
            grade: result.grade,
            remark: result.remark,
          }))}
        />
      </DashboardPanel>
    </main>
  );
}
