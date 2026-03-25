import { notFound } from "next/navigation";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { ScheduleEditForm } from "@/components/dashboard/schedule-edit-form";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { SessionUser } from "@/types";

export default async function AdminScheduleEditPage({
  params,
}: {
  params: Promise<{ scheduleId: string }>;
}) {
  const { scheduleId } = await params;
  const session = await auth();
  const user = session?.user as SessionUser;

  const [schedule, subjects] = await Promise.all([
    prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        class: {
          schoolId: user.schoolId,
        },
      },
      include: {
        subject: {
          select: {
            id: true,
          },
        },
      },
    }),
    prisma.subject.findMany({
      where: {
        schoolId: user.schoolId,
      },
      orderBy: [{ class: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        class: {
          select: {
            name: true,
          },
        },
        teachers: {
          select: {
            teacher: {
              select: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  if (!schedule) {
    notFound();
  }

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Timetable"
        title="Edit timetable slot"
        description="Adjust the subject, day, or period timing while still enforcing class and teacher conflict rules."
      >
        <ScheduleEditForm
          scheduleId={schedule.id}
          subjects={subjects.map((subject) => ({
            id: subject.id,
            name: subject.name,
            className: subject.class.name,
            teacherLabel: subject.teachers
              .map((entry) => `${entry.teacher.user.firstName} ${entry.teacher.user.lastName}`)
              .join(", "),
          }))}
          initialValues={{
            subjectId: schedule.subject.id,
            day: schedule.day,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
          }}
        />
      </DashboardPanel>
    </main>
  );
}
