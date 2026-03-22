import { cache } from "react";
import prisma from "@/lib/prisma";
import type {
  AdminAnnouncementItem,
  AdminDashboardStats,
  AdminQuickStat,
  AdminRosterItem,
} from "@/types";

export const getAdminDashboardData = cache(async (schoolId: string) => {
  const [
    totalTeachers,
    totalStudents,
    totalClasses,
    totalSubjects,
    totalAnnouncements,
    recentUsers,
    classes,
    announcements,
    activeExams,
  ] = await Promise.all([
    prisma.teacher.count({
      where: { user: { schoolId } },
    }),
    prisma.student.count({
      where: { user: { schoolId } },
    }),
    prisma.class.count({
      where: { schoolId },
    }),
    prisma.subject.count({
      where: { schoolId },
    }),
    prisma.announcement.count({
      where: { schoolId, isActive: true },
    }),
    prisma.user.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        accessId: true,
        createdAt: true,
      },
    }),
    prisma.class.findMany({
      where: { schoolId },
      orderBy: [{ level: "asc" }, { name: "asc" }],
      take: 6,
      select: {
        id: true,
        name: true,
        level: true,
        classTeacher: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    }),
    prisma.announcement.findMany({
      where: { schoolId },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        content: true,
        priority: true,
        createdAt: true,
        isActive: true,
      },
    }),
    prisma.exam.count({
      where: {
        class: { schoolId },
        isPublished: true,
      },
    }),
  ]);

  const stats: AdminDashboardStats = {
    totalTeachers,
    totalStudents,
    totalClasses,
    totalSubjects,
    recentRegistrations: recentUsers.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      accessId: user.accessId,
      createdAt: user.createdAt.toISOString(),
    })),
    classTeacherSummary: classes.map((schoolClass) => ({
      classId: schoolClass.id,
      className: schoolClass.name,
      teacherName: schoolClass.classTeacher
        ? `${schoolClass.classTeacher.user.firstName} ${schoolClass.classTeacher.user.lastName}`
        : null,
      totalStudents: schoolClass._count.students,
    })),
    announcements: announcements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      createdAt: announcement.createdAt.toISOString(),
    })),
  };

  const quickStats: AdminQuickStat[] = [
    {
      label: "Teachers",
      value: totalTeachers,
      helper: "Faculty accounts ready for assignment",
    },
    {
      label: "Students",
      value: totalStudents,
      helper: "Learners enrolled across all levels",
    },
    {
      label: "Classes",
      value: totalClasses,
      helper: "Classrooms configured for the session",
    },
    {
      label: "Published Exams",
      value: activeExams,
      helper: "Assessments currently visible to students",
    },
  ];

  const teacherRoster: AdminRosterItem[] = await prisma.teacher.findMany({
    where: { user: { schoolId } },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true,
      qualification: true,
      specialization: true,
      classTeacherOf: {
        select: {
          name: true,
        },
      },
      subjects: {
        take: 3,
        select: {
          subject: {
            select: {
              name: true,
            },
          },
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
          accessId: true,
          email: true,
          phone: true,
        },
      },
    },
  }).then((teachers) =>
    teachers.map((teacher) => ({
      id: teacher.id,
      name: `${teacher.user.firstName} ${teacher.user.lastName}`,
      accessId: teacher.user.accessId,
      subtitle:
        teacher.specialization ||
        teacher.qualification ||
        "Faculty profile awaiting full setup",
      meta: teacher.classTeacherOf?.name || teacher.user.email || teacher.user.phone || "No class assigned yet",
      tags: teacher.subjects.map((item) => item.subject.name),
    }))
  );

  const studentRoster: AdminRosterItem[] = await prisma.student.findMany({
    where: { user: { schoolId } },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true,
      class: {
        select: {
          name: true,
        },
      },
      parentName: true,
      parentPhone: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          accessId: true,
        },
      },
    },
  }).then((students) =>
    students.map((student) => ({
      id: student.id,
      name: `${student.user.firstName} ${student.user.lastName}`,
      accessId: student.user.accessId,
      subtitle: student.class?.name || "No class assigned yet",
      meta: student.parentName || student.parentPhone || "Parent details pending",
      tags: student.class?.name ? [student.class.name] : [],
    }))
  );

  const announcementItems: AdminAnnouncementItem[] = announcements.map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    createdAt: announcement.createdAt.toISOString(),
    priority: announcement.priority,
    status: announcement.isActive ? "Active" : "Archived",
  }));

  return {
    stats,
    quickStats,
    teacherRoster,
    studentRoster,
    announcementItems,
    totalAnnouncements,
  };
});

