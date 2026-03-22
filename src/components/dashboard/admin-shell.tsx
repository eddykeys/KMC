import type { ReactNode } from "react";
import { Building2, ShieldCheck } from "lucide-react";
import { AdminNav } from "@/components/dashboard/admin-nav";

interface AdminShellProps {
  children: ReactNode;
  userName: string;
  schoolName: string;
  schoolCode: string;
}

export function AdminShell({
  children,
  userName,
  schoolName,
  schoolCode,
}: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_28%),linear-gradient(180deg,_#111827_0%,_#0f172a_48%,_#020617_100%)] text-stone-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:flex-row lg:px-8">
        <aside className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-80 lg:flex-none">
          <div className="flex h-full flex-col rounded-[28px] border border-white/10 bg-black/20 p-5 shadow-2xl backdrop-blur">
            <div className="mb-6 rounded-3xl border border-amber-300/20 bg-amber-100/10 p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-2xl bg-amber-300 p-3 text-stone-950">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-amber-200/80">
                    KMC Admin
                  </p>
                  <h1 className="text-lg font-semibold text-white">{schoolName}</h1>
                </div>
              </div>
              <p className="text-sm text-stone-300">
                Administrative command center for {schoolCode} operations.
              </p>
            </div>

            <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.25em]">
                  Active Session
                </span>
              </div>
              <p className="text-lg font-semibold text-white">{userName}</p>
              <p className="text-sm text-stone-400">
                Signed in with administrator privileges.
              </p>
            </div>

            <AdminNav />

            <div className="mt-auto rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-stone-400">
                Phase 2
              </p>
              <p className="mt-2 text-sm text-stone-300">
                Admin navigation, overview, and route scaffolding are live. The next passes can
                deepen CRUD flows and reporting.
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

