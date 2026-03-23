import type { ReactNode } from "react";
import { BookOpenCheck, GraduationCap, NotebookPen } from "lucide-react";
import { TeacherNav } from "@/components/dashboard/teacher-nav";

interface TeacherShellProps {
  children: ReactNode;
  teacherName: string;
  schoolName: string;
  accessId: string;
}

export function TeacherShell({
  children,
  teacherName,
  schoolName,
  accessId,
}: TeacherShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_28%),linear-gradient(180deg,_#082f49_0%,_#0f172a_46%,_#020617_100%)] text-stone-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:flex-row lg:px-8">
        <aside className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-80 lg:flex-none">
          <div className="flex h-full flex-col rounded-[28px] border border-white/10 bg-black/20 p-5 shadow-2xl backdrop-blur">
            <div className="mb-6 rounded-3xl border border-sky-300/20 bg-sky-100/10 p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-2xl bg-sky-300 p-3 text-slate-950">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-sky-100/80">
                    Teacher Desk
                  </p>
                  <h1 className="text-lg font-semibold text-white">{schoolName}</h1>
                </div>
              </div>
              <p className="text-sm text-stone-300">
                Daily teaching overview for class delivery, assessments, and lesson preparation.
              </p>
            </div>

            <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-lg font-semibold text-white">{teacherName}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.22em] text-stone-500">
                {accessId}
              </p>
              <div className="mt-4 grid gap-2 text-sm text-stone-300">
                <div className="flex items-center gap-2">
                  <BookOpenCheck className="h-4 w-4 text-sky-200" />
                  <span>Lesson readiness</span>
                </div>
                <div className="flex items-center gap-2">
                  <NotebookPen className="h-4 w-4 text-sky-200" />
                  <span>Exam coordination</span>
                </div>
              </div>
            </div>

            <TeacherNav />

            <div className="mt-auto rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-stone-400">
                Next Phase
              </p>
              <p className="mt-2 text-sm text-stone-300">
                Teacher-facing planning and assessment flows can now grow on top of this overview shell.
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
