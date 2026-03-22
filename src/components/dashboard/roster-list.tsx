import { getInitials } from "@/lib/utils";
import type { AdminRosterItem } from "@/types";

interface RosterListProps {
  items: AdminRosterItem[];
  emptyTitle: string;
  emptyDescription: string;
}

export function RosterList({
  items,
  emptyTitle,
  emptyDescription,
}: RosterListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
        <p className="font-semibold text-white">{emptyTitle}</p>
        <p className="mt-2">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300/15 text-sm font-semibold text-amber-100">
              {getInitials(item.name.split(" ")[0] || "A", item.name.split(" ").slice(1).join("") || "U")}
            </div>
            <div>
              <p className="font-semibold text-white">{item.name}</p>
              <p className="text-sm text-stone-400">{item.subtitle}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                {item.accessId}
              </p>
            </div>
          </div>

          <div className="md:max-w-sm md:text-right">
            <p className="text-sm text-stone-300">{item.meta}</p>
            {item.tags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2 md:justify-end">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-amber-200/15 bg-amber-300/10 px-3 py-1 text-xs text-amber-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

