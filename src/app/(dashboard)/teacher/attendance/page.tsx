import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { AttendanceMarkForm } from "@/components/dashboard/attendance-mark-form";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default async function TeacherAttendancePage() {
  const session = await auth();
  const user = session?.user as SessionUser;

  const [classes, terms, recentAttendance] = await Promise.all([
    prisma.class.findMany({
      where: {
        OR: [
          { classTeacherId: user.teacherId },
          {
            subjects: {
              some: {
                teachers: {
                  some: {
                    teacherId: user.teacherId,
                  },
                },
              },
            },
          },
        ],
      },
      orderBy: [{ level: "asc" }, { name: "asc" }],
      include: {
        students: {
          orderBy: [{ user: { firstName: "asc" } }, { user: { lastName: "asc" } }],
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                accessId: true,
              },
            },
          },
        },
      },
    }),
    prisma.term.findMany({
      where: {
        session: {
          schoolId: user.schoolId,
        },
      },
      orderBy: [{ session: { startDate: "desc" } }, { startDate: "asc" }],
      select: {
        id: true,
        name: true,
        session: {
          select: { name: true },
        },
      },
    }),
    prisma.attendance.findMany({
      where: {
        teacherId: user.teacherId,
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 16,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        class: {
          select: { name: true },
        },
        term: {
          select: { name: true },
        },
      },
    }),
  ]);

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Attendance"
        title="Mark class attendance"
        description="Record daily attendance for the classes available under your teaching account."
      >
        {classes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No classes are currently available for attendance marking under this account.
          </div>
        ) : (
          <div className="grid gap-6">
            {classes.map((classItem) => (
              <article
                key={classItem.id}
                className="rounded-[30px] border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="mb-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                    {classItem.level}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{classItem.name}</h3>
                  <p className="mt-1 text-sm text-stone-400">
                    {classItem.students.length} student(s) ready for attendance capture.
                  </p>
                </div>
                <AttendanceMarkForm
                  classId={classItem.id}
                  terms={terms.map((term) => ({
                    id: term.id,
                    name: term.name,
                    sessionName: term.session.name,
                  }))}
                  students={classItem.students.map((student) => ({
                    id: student.id,
                    fullName: `${student.user.firstName} ${student.user.lastName}`,
                    accessId: student.user.accessId,
                  }))}
                />
              </article>
            ))}
          </div>
        )}
      </DashboardPanel>

      <DashboardPanel
        eyebrow="Recent registers"
        title="Latest attendance records"
        description="A quick log of your most recent attendance updates across classes and terms."
      >
        {recentAttendance.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No attendance records have been saved yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {recentAttendance.map((record) => (
              <article
                key={record.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">
                      {record.student.user.firstName} {record.student.user.lastName}
                    </p>
                    <p className="mt-1 text-sm text-stone-400">
                      {record.class.name} • {record.term.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">{record.status}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      {formatDate(record.date)}
                    </p>
                  </div>
                </div>
                {record.note ? <p className="mt-3 text-sm text-stone-300">{record.note}</p> : null}
              </article>
            ))}
          </div>
        )}
      </DashboardPanel>
    </main>
  );
}
