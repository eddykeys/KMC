"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TEACHER_NAV_ITEMS = [
  { href: "/teacher", label: "Overview", description: "Teaching pulse" },
  { href: "/teacher/lesson-plans", label: "Lesson Plans", description: "Plan and draft" },
  { href: "/teacher/exams", label: "Exams", description: "Assess and publish" },
  { href: "/teacher/results", label: "Results", description: "Score and review" },
  { href: "/teacher/attendance", label: "Attendance", description: "Daily class register" },
  { href: "/teacher/weekly-reports", label: "Weekly Reports", description: "Teaching summaries" },
];

export function TeacherNav() {
  const pathname = usePathname();

  return (
    <nav className="grid gap-2">
      {TEACHER_NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/teacher"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-2xl border px-4 py-3 transition",
              isActive
                ? "border-sky-300 bg-sky-50 text-slate-950 shadow-sm"
                : "border-white/10 bg-white/5 text-stone-300 hover:border-sky-200/40 hover:bg-white/10 hover:text-white"
            )}
          >
            <div className="text-sm font-semibold">{item.label}</div>
            <div className={cn("text-xs", isActive ? "text-slate-600" : "text-stone-400")}>
              {item.description}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
