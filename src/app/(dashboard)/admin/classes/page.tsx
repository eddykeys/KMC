import { Trash2 } from "lucide-react";
import { deleteClassFormAction } from "@/app/(dashboard)/admin/classes/actions";
import { ClassCreateForm } from "@/components/dashboard/class-create-form";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { SessionUser } from "@/types";

export default async function AdminClassesPage() {
  const session = await auth();
  const user = session?.user as SessionUser;

  const [classes, availableTeachers] = await Promise.all([
    prisma.class.findMany({
      where: { schoolId: user.schoolId },
      orderBy: [{ level: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        level: true,
        classTeacher: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
            subjects: true,
          },
        },
      },
    }),
    prisma.teacher.findMany({
      where: {
        user: { schoolId: user.schoolId },
        classTeacherOf: null,
      },
      orderBy: [
        { user: { firstName: "asc" } },
        { user: { lastName: "asc" } },
      ],
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

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Classes"
        title="Create class records"
        description="Set up academic classes and optionally assign a class teacher from the available faculty list."
      >
        <ClassCreateForm
          teachers={availableTeachers.map((teacher) => ({
            id: teacher.id,
            firstName: teacher.user.firstName,
            lastName: teacher.user.lastName,
            accessId: teacher.user.accessId,
          }))}
        />
      </DashboardPanel>

      <DashboardPanel
        eyebrow="Structure"
        title="Class structure"
        description="Each class record shows ownership, student count, and subject readiness. Delete is live while richer edit flows can follow next."
      >
        {classes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No classes have been configured yet. Use the form above to create the first class.
          </div>
        ) : (
          <div className="grid gap-3">
            {classes.map((schoolClass) => (
              <article
                key={schoolClass.id}
                className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 xl:flex-row xl:items-center xl:justify-between"
              >
                <div>
                  <p className="text-lg font-semibold text-white">{schoolClass.name}</p>
                  <p className="mt-1 text-sm text-stone-400">
                    {schoolClass.classTeacher
                      ? `${schoolClass.classTeacher.user.firstName} ${schoolClass.classTeacher.user.lastName}`
                      : "No class teacher assigned yet"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                    <span>{schoolClass.level}</span>
                    <span>{schoolClass._count.students} students</span>
                    <span>{schoolClass._count.subjects} subjects</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 xl:items-end">
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <span className="rounded-full border border-emerald-200/15 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
                      {schoolClass._count.students} enrolled
                    </span>
                    <span className="rounded-full border border-amber-200/15 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                      {schoolClass._count.subjects} subjects
                    </span>
                  </div>

                  <form action={deleteClassFormAction}>
                    <input type="hidden" name="classId" value={schoolClass.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-400/20"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove class
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </DashboardPanel>
    </main>
  );
}
