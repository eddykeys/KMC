import type { ReactNode } from "react";

interface DashboardPanelProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function DashboardPanel({
  eyebrow,
  title,
  description,
  children,
}: DashboardPanelProps) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-slate-950/60 p-6 shadow-2xl backdrop-blur">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-400">{description}</p>
      </div>
      {children}
    </section>
  );
}

