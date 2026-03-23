import { cache } from "react";
import prisma from "@/lib/prisma";

export const getTeacherDashboardData = cache(async (teacherId: string) => {
  const [
    teacher,
    lessonPlanCount,
    examCount,
    weeklyReportCount,
    classCount,
    subjectCount,
    upcomingExams,
    recentLessonPlans,
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
  ]);

  return {
    teacher,
    stats: {
      lessonPlanCount,
      examCount,
      weeklyReportCount,
      classCount,
      subjectCount,
    },
    upcomingExams,
    recentLessonPlans,
  };
});
