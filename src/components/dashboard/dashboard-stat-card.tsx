import type { ReactNode } from "react";

interface DashboardStatCardProps {
  label: string;
  value: string | number;
  helper: string;
  icon: ReactNode;
}

export function DashboardStatCard({
  label,
  value,
  helper,
  icon,
}: DashboardStatCardProps) {
  return (
    <article className="rounded-[28px] border border-white/10 bg-white/8 p-5 shadow-lg backdrop-blur">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-stone-300">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
        </div>
        <div className="rounded-2xl bg-amber-300/15 p-3 text-amber-200">{icon}</div>
      </div>
      <p className="text-sm leading-6 text-stone-400">{helper}</p>
    </article>
  );
}

