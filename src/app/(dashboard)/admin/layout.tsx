import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { SessionUser } from "@/types";

export const metadata: Metadata = {
  title: "Admin Dashboard | KMC School Management System",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as SessionUser;

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  const school = await prisma.school.findUnique({
    where: { id: user.schoolId },
    select: { name: true, code: true },
  });

  return (
    <AdminShell
      userName={`${user.firstName} ${user.lastName}`}
      schoolName={school?.name ?? "School Workspace"}
      schoolCode={school?.code ?? user.schoolCode}
    >
      {children}
    </AdminShell>
  );
}
