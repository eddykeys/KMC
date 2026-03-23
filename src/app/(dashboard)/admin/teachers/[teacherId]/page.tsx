import { notFound } from "next/navigation";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { TeacherEditForm } from "@/components/dashboard/teacher-edit-form";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { SessionUser } from "@/types";

export default async function AdminTeacherEditPage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const { teacherId } = await params;
  const session = await auth();
  const user = session?.user as SessionUser;

  const teacher = await prisma.teacher.findFirst({
    where: {
      id: teacherId,
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
          email: true,
          gender: true,
          phone: true,
        },
      },
    },
  });

  if (!teacher) {
    notFound();
  }

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Faculty"
        title="Edit teacher profile"
        description="Update profile details, contact information, and academic specialization without recreating the account."
      >
        <TeacherEditForm
          teacherId={teacher.id}
          initialValues={{
            firstName: teacher.user.firstName,
            lastName: teacher.user.lastName,
            middleName: teacher.user.middleName || "",
            email: teacher.user.email || "",
            gender: teacher.user.gender || "MALE",
            phone: teacher.user.phone || "",
            qualification: teacher.qualification || "",
            specialization: teacher.specialization || "",
            dateOfBirth: teacher.dateOfBirth
              ? new Date(teacher.dateOfBirth).toISOString().slice(0, 10)
              : "",
            address: teacher.address || "",
          }}
        />
      </DashboardPanel>
    </main>
  );
}
