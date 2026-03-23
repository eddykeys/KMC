import type { ReactNode } from "react";
import { BookCopy, Sparkles, UserRound } from "lucide-react";
import { StudentNav } from "@/components/dashboard/student-nav";

interface StudentShellProps {
  children: ReactNode;
  studentName: string;
  schoolName: string;
  accessId: string;
}

export function StudentShell({
  children,
  studentName,
  schoolName,
  accessId,
}: StudentShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_28%),linear-gradient(180deg,_#052e2b_0%,_#0f172a_48%,_#020617_100%)] text-stone-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:flex-row lg:px-8">
        <aside className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-80 lg:flex-none">
          <div className="flex h-full flex-col rounded-[28px] border border-white/10 bg-black/20 p-5 shadow-2xl backdrop-blur">
            <div className="mb-6 rounded-3xl border border-emerald-300/20 bg-emerald-100/10 p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-300 p-3 text-slate-950">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-100/80">
                    Student Desk
                  </p>
                  <h1 className="text-lg font-semibold text-white">{schoolName}</h1>
                </div>
              </div>
              <p className="text-sm text-stone-300">
                A focused space for exams, class updates, and learning materials.
              </p>
            </div>

            <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-lg font-semibold text-white">{studentName}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.22em] text-stone-500">
                {accessId}
              </p>
              <div className="mt-4 grid gap-2 text-sm text-stone-300">
                <div className="flex items-center gap-2">
                  <BookCopy className="h-4 w-4 text-emerald-200" />
                  <span>Assigned learning materials</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-200" />
                  <span>Upcoming exam readiness</span>
                </div>
              </div>
            </div>

            <StudentNav />
          </div>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
