"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Overview", description: "Live school pulse" },
  { href: "/admin/teachers", label: "Teachers", description: "Faculty directory" },
  { href: "/admin/students", label: "Students", description: "Enrollment watch" },
  { href: "/admin/classes", label: "Classes", description: "Structure and owners" },
  { href: "/admin/announcements", label: "Announcements", description: "Message board" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="grid gap-2">
      {ADMIN_NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-2xl border px-4 py-3 transition",
              isActive
                ? "border-amber-300 bg-amber-50 text-stone-950 shadow-sm"
                : "border-white/10 bg-white/5 text-stone-300 hover:border-amber-200/40 hover:bg-white/10 hover:text-white"
            )}
          >
            <div className="text-sm font-semibold">{item.label}</div>
            <div className={cn("text-xs", isActive ? "text-stone-600" : "text-stone-400")}>
              {item.description}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

