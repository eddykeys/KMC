import Link from "next/link";
import { Trash2 } from "lucide-react";
import { deleteStudentFormAction } from "@/app/(dashboard)/admin/students/actions";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { StudentCreateForm } from "@/components/dashboard/student-create-form";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getStudents } from "@/actions/user-actions";
import type { SessionUser } from "@/types";

export default async function AdminStudentsPage() {
  const session = await auth();
  const user = session?.user as SessionUser;

  const [students, classes] = await Promise.all([
    getStudents(user.schoolId, { pageSize: 50 }),
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

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Enrollment"
        title="Create student accounts"
        description="Add new student records with class placement and guardian details. This mirrors the teacher workflow and gives the admin desk a second working CRUD surface."
      >
        <StudentCreateForm classes={classes} />
      </DashboardPanel>

      <DashboardPanel
        eyebrow="Students"
        title="Enrollment directory"
        description="Current student records for this school, with quick visibility into class placement and parent contact details."
      >
        {students.data.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No students enrolled yet. Use the form above to create the first student account.
          </div>
        ) : (
          <div className="grid gap-3">
            {students.data.map((student) => (
              <article
                key={student.id}
                className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 xl:flex-row xl:items-center xl:justify-between"
              >
                <div>
                  <p className="text-lg font-semibold text-white">
                    {student.user.firstName} {student.user.lastName}
                  </p>
                  <p className="mt-1 text-sm text-stone-400">
                    {student.class?.name || "No class assigned yet"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                    <span>{student.user.accessId}</span>
                    {student.parentName ? <span>{student.parentName}</span> : null}
                    {student.parentPhone ? <span>{student.parentPhone}</span> : null}
                    {student.parentEmail ? <span>{student.parentEmail}</span> : null}
                  </div>
                </div>

                <div className="flex flex-col gap-3 xl:items-end">
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <span className="rounded-full border border-emerald-200/15 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
                      {student.class?.level || "Class pending"}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300">
                      {student.user.gender || "Gender pending"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 xl:justify-end">
                    <Link
                      href={`/admin/students/${student.id}`}
                      className="inline-flex items-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-300/20"
                    >
                      Edit student
                    </Link>
                    <form action={deleteStudentFormAction}>
                      <input type="hidden" name="studentId" value={student.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-400/20"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove student
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </DashboardPanel>
    </main>
  );
}
