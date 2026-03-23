import { Trash2, UserPlus, X } from "lucide-react";
import {
  assignTeacherToSubjectFormAction,
  deleteSubjectFormAction,
  removeTeacherFromSubjectFormAction,
} from "@/app/(dashboard)/admin/subjects/actions";
import { SubjectCreateForm } from "@/components/dashboard/subject-create-form";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { SessionUser } from "@/types";

export default async function AdminSubjectsPage() {
  const session = await auth();
  const user = session?.user as SessionUser;

  const [subjects, classes, teachers] = await Promise.all([
    prisma.subject.findMany({
      where: { schoolId: user.schoolId },
      orderBy: [{ class: { level: "asc" } }, { class: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
        class: {
          select: {
            name: true,
            level: true,
          },
        },
        teachers: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    accessId: true,
                  },
                },
              },
            },
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
    prisma.teacher.findMany({
      where: { user: { schoolId: user.schoolId } },
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

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Subjects"
        title="Build the academic map"
        description="Create subjects under classes and optionally assign a teacher immediately so teaching structure becomes visible across the dashboard."
      >
        <SubjectCreateForm
          classes={classes}
          teachers={teachers.map((teacher) => ({
            id: teacher.id,
            firstName: teacher.user.firstName,
            lastName: teacher.user.lastName,
            accessId: teacher.user.accessId,
          }))}
        />
      </DashboardPanel>

      <DashboardPanel
        eyebrow="Curriculum"
        title="Subject directory"
        description="Subjects are grouped by class and now support direct teacher assignment changes, so the admin team can correct staffing without recreating records."
      >
        {subjects.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No subjects have been created yet. Use the form above to add the first subject.
          </div>
        ) : (
          <div className="grid gap-3">
            {subjects.map((subject) => (
              <article
                key={subject.id}
                className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 xl:flex-row xl:items-center xl:justify-between"
              >
                <div>
                  <p className="text-lg font-semibold text-white">{subject.name}</p>
                  <p className="mt-1 text-sm text-stone-400">
                    {subject.class.name} ({subject.class.level})
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                    {subject.code ? <span>{subject.code}</span> : null}
                    <span>{subject.teachers.length} teacher assignment(s)</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 xl:items-end">
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    {subject.teachers.length > 0 ? (
                      subject.teachers.map((assignment) => (
                        <form
                          key={assignment.id}
                          action={removeTeacherFromSubjectFormAction}
                          className="inline-flex"
                        >
                          <input type="hidden" name="assignmentId" value={assignment.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-full border border-emerald-200/15 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100 transition hover:bg-emerald-300/20"
                          >
                            {assignment.teacher.user.firstName} {assignment.teacher.user.lastName}
                            <X className="h-3 w-3" />
                          </button>
                        </form>
                      ))
                    ) : (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300">
                        No teacher assigned
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 xl:items-end">
                    <form
                      action={assignTeacherToSubjectFormAction}
                      className="flex flex-col gap-2 sm:flex-row"
                    >
                      <input type="hidden" name="subjectId" value={subject.id} />
                      <select
                        name="teacherId"
                        defaultValue=""
                        className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-white outline-none transition focus:border-amber-300/50"
                      >
                        <option value="">Assign teacher</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.user.firstName} {teacher.user.lastName} ({teacher.user.accessId})
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-300/20"
                      >
                        <UserPlus className="h-4 w-4" />
                        Assign
                      </button>
                    </form>

                    <form action={deleteSubjectFormAction}>
                      <input type="hidden" name="subjectId" value={subject.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-400/20"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove subject
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
