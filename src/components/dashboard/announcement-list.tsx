import { formatDate, truncate } from "@/lib/utils";
import type { AdminAnnouncementItem } from "@/types";

interface AnnouncementListProps {
  items: AdminAnnouncementItem[];
}

const PRIORITY_LABELS: Record<number, string> = {
  0: "Normal",
  1: "Important",
  2: "Urgent",
};

export function AnnouncementList({ items }: AnnouncementListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
        <p className="font-semibold text-white">No announcements yet</p>
        <p className="mt-2">
          Create your first bulletin to communicate changes, reminders, or school-wide notices.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-100">
              {PRIORITY_LABELS[item.priority] ?? "Normal"}
            </span>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-stone-300">
              {item.status}
            </span>
            <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
              {formatDate(item.createdAt)}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-400">{truncate(item.content, 180)}</p>
        </article>
      ))}
    </div>
  );
}

