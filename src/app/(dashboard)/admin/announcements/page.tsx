import { Archive } from "lucide-react";
import { archiveAnnouncementFormAction } from "@/app/(dashboard)/admin/announcements/actions";
import { AnnouncementCreateForm } from "@/components/dashboard/announcement-create-form";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatDate, truncate } from "@/lib/utils";
import type { SessionUser } from "@/types";

const PRIORITY_LABELS: Record<number, string> = {
  0: "Normal",
  1: "Important",
  2: "Urgent",
};

export default async function AdminAnnouncementsPage() {
  const session = await auth();
  const user = session?.user as SessionUser;

  const [announcements, classes] = await Promise.all([
    prisma.announcement.findMany({
      where: { schoolId: user.schoolId },
      orderBy: [{ isActive: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        content: true,
        priority: true,
        isActive: true,
        createdAt: true,
        expiresAt: true,
        class: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.class.findMany({
      where: { schoolId: user.schoolId },
      orderBy: [{ level: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Announcements"
        title="Publish school updates"
        description="Create school-wide or class-targeted bulletins here so the admin team can manage communication directly from the dashboard."
      >
        <AnnouncementCreateForm classes={classes} />
      </DashboardPanel>

      <DashboardPanel
        eyebrow="Board"
        title="School message board"
        description="Recent announcements stay visible here with their priority, target audience, and archive controls."
      >
        {announcements.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No announcements yet. Publish the first bulletin with the form above.
          </div>
        ) : (
          <div className="grid gap-3">
            {announcements.map((announcement) => (
              <article
                key={announcement.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-100">
                    {PRIORITY_LABELS[announcement.priority] ?? "Normal"}
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-stone-300">
                    {announcement.isActive ? "Active" : "Archived"}
                  </span>
                  <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                    {formatDate(announcement.createdAt)}
                  </span>
                  <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                    {announcement.class?.name || "School-wide"}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-white">{announcement.title}</h3>
                {announcement.expiresAt ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-stone-500">
                    Expires {formatDate(announcement.expiresAt)}
                  </p>
                ) : null}
                <p className="mt-3 text-sm leading-6 text-stone-400">
                  {truncate(announcement.content, 240)}
                </p>

                {announcement.isActive ? (
                  <form action={archiveAnnouncementFormAction} className="mt-4">
                    <input type="hidden" name="announcementId" value={announcement.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-300/20"
                    >
                      <Archive className="h-4 w-4" />
                      Archive announcement
                    </button>
                  </form>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </DashboardPanel>
    </main>
  );
}
