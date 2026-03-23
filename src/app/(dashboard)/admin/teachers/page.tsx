import { Trash2 } from "lucide-react";
import { deleteTeacherFormAction } from "@/app/(dashboard)/admin/teachers/actions";
import { TeacherCreateForm } from "@/components/dashboard/teacher-create-form";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { auth } from "@/lib/auth";
import { getTeachers } from "@/actions/user-actions";
import type { SessionUser } from "@/types";

export default async function AdminTeachersPage() {
  const session = await auth();
  const user = session?.user as SessionUser;
  const teachers = await getTeachers(user.schoolId, { pageSize: 50 });

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Provisioning"
        title="Create teacher accounts"
        description="This is the first admin CRUD workflow in Phase 2. Create faculty accounts here and the dashboard will refresh automatically."
      >
        <TeacherCreateForm />
      </DashboardPanel>

      <DashboardPanel
        eyebrow="Teachers"
        title="Faculty directory"
        description="Faculty records created for this school. Delete is live already, while edit and assignment flows can follow next."
      >
        {teachers.data.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No teachers onboarded yet. Use the form above to create the first faculty account.
          </div>
        ) : (
          <div className="grid gap-3">
            {teachers.data.map((teacher) => (
              <article
                key={teacher.id}
                className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 xl:flex-row xl:items-center xl:justify-between"
              >
                <div>
                  <p className="text-lg font-semibold text-white">
                    {teacher.user.firstName} {teacher.user.lastName}
                  </p>
                  <p className="mt-1 text-sm text-stone-400">
                    {teacher.specialization ||
                      teacher.qualification ||
                      "Faculty profile awaiting more academic details"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                    <span>{teacher.user.accessId}</span>
                    {teacher.user.email ? <span>{teacher.user.email}</span> : null}
                    {teacher.user.phone ? <span>{teacher.user.phone}</span> : null}
                  </div>
                </div>

                <div className="flex flex-col gap-3 xl:items-end">
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    {teacher.classTeacherOf ? (
                      <span className="rounded-full border border-emerald-200/15 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
                        Class Teacher: {teacher.classTeacherOf.name}
                      </span>
                    ) : null}
                    {teacher.subjects.length > 0 ? (
                      teacher.subjects.map((subject) => (
                        <span
                          key={subject.id}
                          className="rounded-full border border-amber-200/15 bg-amber-300/10 px-3 py-1 text-xs text-amber-100"
                        >
                          {subject.subject.name}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300">
                        No subject assigned
                      </span>
                    )}
                  </div>

                  <form action={deleteTeacherFormAction}>
                    <input type="hidden" name="teacherId" value={teacher.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-400/20"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove teacher
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
