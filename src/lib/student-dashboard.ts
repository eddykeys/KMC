import { cache } from "react";
import prisma from "@/lib/prisma";
import { getCurrentSchoolDay } from "@/lib/utils";

export const getStudentDashboardData = cache(async (studentId: string) => {
  const currentSchoolDay = getCurrentSchoolDay();
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          accessId: true,
        },
      },
      class: {
        select: {
          id: true,
          name: true,
          level: true,
          schoolId: true,
        },
      },
    },
  });

  if (!student) {
    return null;
  }

  const [publishedExams, recentResults, announcements, recentLessonPlans, todaySchedule, latestAttendance] =
    await Promise.all([
    prisma.exam.findMany({
      where: {
        classId: student.classId ?? undefined,
        isPublished: true,
      },
      orderBy: [{ startTime: "asc" }, { createdAt: "desc" }],
      take: 6,
      select: {
        id: true,
        title: true,
        type: true,
        duration: true,
        startTime: true,
        endTime: true,
        subject: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.result.findMany({
      where: { studentId },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        totalScore: true,
        grade: true,
        remark: true,
        subject: { select: { name: true } },
        term: { select: { name: true } },
      },
    }),
    prisma.announcement.findMany({
      where: {
        schoolId: student.class?.schoolId,
        isActive: true,
        OR: [{ classId: null }, { classId: student.classId ?? undefined }],
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        content: true,
        priority: true,
        createdAt: true,
        class: { select: { name: true } },
      },
    }),
    prisma.lessonPlan.findMany({
      where: {
        subject: {
          classId: student.classId ?? undefined,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        topic: true,
        isAIGenerated: true,
        subject: { select: { name: true } },
        createdAt: true,
      },
    }),
    prisma.schedule.findMany({
      where:
        student.classId && currentSchoolDay
          ? {
              classId: student.classId,
              day: currentSchoolDay,
            }
          : {
              id: "__no_schedule__",
            },
      orderBy: [{ startTime: "asc" }],
      select: {
        id: true,
        startTime: true,
        endTime: true,
        subject: {
          select: {
            name: true,
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
        },
      },
    }),
    prisma.attendance.findFirst({
      where: {
        studentId,
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
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

  return {
    student,
    currentSchoolDay,
    publishedExams,
    recentResults,
    announcements,
    recentLessonPlans,
    todaySchedule,
    latestAttendance,
  };
});
