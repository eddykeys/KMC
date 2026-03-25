import { cache } from "react";
import prisma from "@/lib/prisma";
import { getCurrentSchoolDay } from "@/lib/utils";

export const getTeacherDashboardData = cache(async (teacherId: string) => {
  const currentSchoolDay = getCurrentSchoolDay();
  const [
    teacher,
    lessonPlanCount,
    examCount,
    weeklyReportCount,
    classCount,
    subjectCount,
    upcomingExams,
    recentLessonPlans,
    todaySchedule,
    recentAttendance,
  ] = await Promise.all([
    prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            accessId: true,
          },
        },
        classTeacherOf: {
          select: {
            id: true,
            name: true,
            level: true,
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
        subjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                class: {
                  select: {
                    name: true,
                    level: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.lessonPlan.count({
      where: { teacherId },
    }),
    prisma.exam.count({
      where: { teacherId },
    }),
    prisma.weeklyReport.count({
      where: { teacherId },
    }),
    prisma.subjectTeacher.count({
      where: { teacherId },
    }),
    prisma.subjectTeacher.count({
      where: { teacherId },
    }),
    prisma.exam.findMany({
      where: {
        teacherId,
        OR: [{ startTime: { gte: new Date() } }, { startTime: null }],
      },
      orderBy: [{ startTime: "asc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        type: true,
        startTime: true,
        class: {
          select: {
            name: true,
          },
        },
        subject: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.lessonPlan.findMany({
      where: { teacherId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        topic: true,
        createdAt: true,
        subject: {
          select: {
            name: true,
          },
        },
        term: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.schedule.findMany({
      where: currentSchoolDay
        ? {
            day: currentSchoolDay,
            subject: {
              teachers: {
                some: {
                  teacherId,
                },
              },
            },
          }
        : {
            id: "__no_schedule__",
          },
      orderBy: [{ startTime: "asc" }],
      select: {
        id: true,
        startTime: true,
        endTime: true,
        class: {
          select: {
            name: true,
            level: true,
          },
        },
        subject: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.attendance.findMany({
      where: {
        teacherId,
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 80,
      select: {
        date: true,
        status: true,
        class: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const latestAttendanceDate = recentAttendance[0]?.date
    ? recentAttendance[0].date.toISOString().slice(0, 10)
    : null;

  const attendanceSnapshot = latestAttendanceDate
    ? recentAttendance
        .filter((record) => record.date.toISOString().slice(0, 10) === latestAttendanceDate)
        .reduce(
          (summary, record) => {
            summary.classNames.add(record.class.name);
            if (record.status === "PRESENT") summary.present += 1;
            if (record.status === "ABSENT") summary.absent += 1;
            if (record.status === "LATE") summary.late += 1;
            if (record.status === "EXCUSED") summary.excused += 1;
            return summary;
          },
          {
            date: recentAttendance[0].date,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            classNames: new Set<string>(),
          },
        )
    : null;

  return {
    teacher,
    stats: {
      lessonPlanCount,
      examCount,
      weeklyReportCount,
      classCount,
      subjectCount,
    },
    currentSchoolDay,
    upcomingExams,
    recentLessonPlans,
    todaySchedule,
    attendanceSnapshot: attendanceSnapshot
      ? {
          date: attendanceSnapshot.date,
          present: attendanceSnapshot.present,
          absent: attendanceSnapshot.absent,
          late: attendanceSnapshot.late,
          excused: attendanceSnapshot.excused,
          classNames: Array.from(attendanceSnapshot.classNames),
        }
      : null,
  };
});
