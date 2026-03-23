import { notFound } from "next/navigation";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { StudentEditForm } from "@/components/dashboard/student-edit-form";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { SessionUser } from "@/types";

export default async function AdminStudentEditPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const session = await auth();
  const user = session?.user as SessionUser;

  const [student, classes] = await Promise.all([
    prisma.student.findFirst({
      where: {
        id: studentId,
        user: {
          schoolId: user.schoolId,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            middleName: true,
            gender: true,
          },
        },
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

  if (!student) {
    notFound();
  }

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Enrollment"
        title="Edit student profile"
        description="Update class placement, guardian details, and core student information without recreating the account."
      >
        <StudentEditForm
          studentId={student.id}
          classes={classes}
          initialValues={{
            firstName: student.user.firstName,
            lastName: student.user.lastName,
            middleName: student.user.middleName || "",
            gender: student.user.gender || "MALE",
            dateOfBirth: student.dateOfBirth
              ? new Date(student.dateOfBirth).toISOString().slice(0, 10)
              : "",
            address: student.address || "",
            parentName: student.parentName || "",
            parentEmail: student.parentEmail || "",
            parentPhone: student.parentPhone || "",
            classId: student.classId || classes[0]?.id || "",
          }}
        />
      </DashboardPanel>
    </main>
  );
}
