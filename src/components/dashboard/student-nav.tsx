"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const STUDENT_NAV_ITEMS = [
  { href: "/student", label: "Overview", description: "Learning pulse" },
  { href: "/student/exams", label: "Exams", description: "Take assessments" },
  { href: "/student/results", label: "Results", description: "Track performance" },
  { href: "/student/fees", label: "Fees", description: "View balances" },
  { href: "/student/report-cards", label: "Report Cards", description: "Print and export" },
];

export function StudentNav() {
  const pathname = usePathname();

  return (
    <nav className="grid gap-2">
      {STUDENT_NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/student"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-2xl border px-4 py-3 transition",
              isActive
                ? "border-emerald-300 bg-emerald-50 text-slate-950 shadow-sm"
                : "border-white/10 bg-white/5 text-stone-300 hover:border-emerald-200/40 hover:bg-white/10 hover:text-white"
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
