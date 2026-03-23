import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StudentShell } from "@/components/dashboard/student-shell";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { SessionUser } from "@/types";

export const metadata: Metadata = {
  title: "Student Dashboard | KMC School Management System",
};

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as SessionUser;

  if (user.role !== "STUDENT" || !user.studentId) {
    redirect("/");
  }

  const school = await prisma.school.findUnique({
    where: { id: user.schoolId },
    select: { name: true },
  });

  return (
    <StudentShell
      studentName={`${user.firstName} ${user.lastName}`}
      schoolName={school?.name ?? "School Workspace"}
      accessId={user.accessId}
    >
      {children}
    </StudentShell>
  );
}
