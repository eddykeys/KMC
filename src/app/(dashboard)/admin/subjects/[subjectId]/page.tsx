import { notFound } from "next/navigation";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { SubjectEditForm } from "@/components/dashboard/subject-edit-form";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { SessionUser } from "@/types";

export default async function AdminSubjectEditPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  const session = await auth();
  const user = session?.user as SessionUser;

  const [subject, classes] = await Promise.all([
    prisma.subject.findFirst({
      where: {
        id: subjectId,
        schoolId: user.schoolId,
      },
      select: {
        id: true,
        name: true,
        code: true,
        classId: true,
      },
    }),
    prisma.class.findMany({
      where: { schoolId: user.schoolId },
      orderBy: [{ level: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        level: true,
      },
    }),
  ]);

  if (!subject) {
    notFound();
  }

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Curriculum"
        title="Edit subject"
        description="Update subject naming, code, and class mapping while preserving teacher assignments."
      >
        <SubjectEditForm
          subjectId={subject.id}
          classes={classes}
          initialValues={{
            name: subject.name,
            code: subject.code || "",
            classId: subject.classId,
          }}
        />
      </DashboardPanel>
    </main>
  );
}
