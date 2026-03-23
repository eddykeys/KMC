import { notFound } from "next/navigation";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { ClassEditForm } from "@/components/dashboard/class-edit-form";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { SessionUser } from "@/types";

export default async function AdminClassEditPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const session = await auth();
  const user = session?.user as SessionUser;

  const [schoolClass, teachers] = await Promise.all([
    prisma.class.findFirst({
      where: {
        id: classId,
        schoolId: user.schoolId,
      },
      select: {
        id: true,
        name: true,
        level: true,
        classTeacherId: true,
      },
    }),
    prisma.teacher.findMany({
      where: {
        user: { schoolId: user.schoolId },
      },
      orderBy: [{ user: { firstName: "asc" } }, { user: { lastName: "asc" } }],
      select: {
        id: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            accessId: true,
          },
        },
      },
    }),
  ]);

  if (!schoolClass) {
    notFound();
  }

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Structure"
        title="Edit class"
        description="Update class naming, level, and class-teacher ownership without recreating the class."
      >
        <ClassEditForm
          classId={schoolClass.id}
          teachers={teachers.map((teacher) => ({
            id: teacher.id,
            firstName: teacher.user.firstName,
            lastName: teacher.user.lastName,
            accessId: teacher.user.accessId,
          }))}
          initialValues={{
            name: schoolClass.name,
            level: schoolClass.level,
            classTeacherId: schoolClass.classTeacherId || "",
          }}
        />
      </DashboardPanel>
    </main>
  );
}
