"use server";

import { revalidatePath } from "next/cache";
import { DayOfWeek } from "@prisma/client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { copyScheduleDaySchema, createScheduleSchema } from "@/lib/validators";
import type { SessionUser } from "@/types";

export interface ScheduleFormState {
  success: boolean;
  message: string;
  errors?: Partial<Record<"subjectId" | "day" | "startTime" | "endTime", string[]>>;
}

export interface CopyScheduleFormState {
  success: boolean;
  message: string;
  errors?: Partial<Record<"classId" | "sourceDay" | "targetDay", string[]>>;
}

async function getAuthorizedAdmin() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized request.");
  }

  return user;
}

async function findSubjectForSchedule(subjectId: string, schoolId: string) {
  return prisma.subject.findFirst({
    where: {
      id: subjectId,
      schoolId,
    },
    include: {
      teachers: {
        select: {
          teacherId: true,
        },
      },
    },
  });
}

async function validateScheduleConflicts({
  classId,
  teacherIds,
  day,
  startTime,
  endTime,
  excludeScheduleId,
}: {
  classId: string;
  teacherIds: string[];
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  excludeScheduleId?: string;
}) {
  const classConflict = await prisma.schedule.findFirst({
    where: {
      classId,
      day,
      startTime: {
        lt: endTime,
      },
      endTime: {
        gt: startTime,
      },
      ...(excludeScheduleId ? { id: { not: excludeScheduleId } } : {}),
    },
    select: {
      id: true,
    },
  });

  if (classConflict) {
    return "This class already has a period that overlaps with that time slot.";
  }

  if (teacherIds.length > 0) {
    const teacherConflict = await prisma.schedule.findFirst({
      where: {
        day,
        startTime: {
          lt: endTime,
        },
        endTime: {
          gt: startTime,
        },
        ...(excludeScheduleId ? { id: { not: excludeScheduleId } } : {}),
        subject: {
          teachers: {
            some: {
              teacherId: {
                in: teacherIds,
              },
            },
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (teacherConflict) {
      return "One of the assigned teachers already has a conflicting timetable slot.";
    }
  }

  return null;
}

function revalidateSchedulePaths(scheduleId?: string) {
  revalidatePath("/admin/schedules");
  if (scheduleId) {
    revalidatePath(`/admin/schedules/${scheduleId}`);
  }
  revalidatePath("/teacher");
  revalidatePath("/teacher/timetable");
  revalidatePath("/student");
  revalidatePath("/student/timetable");
}

export async function createScheduleFormAction(
  _prevState: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  let user: SessionUser;

  try {
    user = await getAuthorizedAdmin();
  } catch {
    return {
      success: false,
      message: "Unauthorized request.",
    };
  }

  const parsed = createScheduleSchema.safeParse({
    subjectId: formData.get("subjectId"),
    day: formData.get("day"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const subject = await findSubjectForSchedule(parsed.data.subjectId, user.schoolId);

    if (!subject) {
      return {
        success: false,
        message: "Selected subject is not available for this school.",
      };
    }

    const teacherIds = subject.teachers.map((teacher) => teacher.teacherId);
    const conflictMessage = await validateScheduleConflicts({
      classId: subject.classId,
      teacherIds,
      day: parsed.data.day,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
    });

    if (conflictMessage) {
      return {
        success: false,
        message: conflictMessage,
      };
    }

    await prisma.schedule.create({
      data: {
        classId: subject.classId,
        subjectId: subject.id,
        day: parsed.data.day,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
      },
    });

    revalidateSchedulePaths();

    return {
      success: true,
      message: "Timetable entry created successfully.",
    };
  } catch (error) {
    console.error("Failed to create schedule entry:", error);
    return {
      success: false,
      message: "Failed to create timetable entry.",
    };
  }
}

export async function updateScheduleFormAction(
  scheduleId: string,
  _prevState: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  let user: SessionUser;

  try {
    user = await getAuthorizedAdmin();
  } catch {
    return {
      success: false,
      message: "Unauthorized request.",
    };
  }

  const parsed = createScheduleSchema.safeParse({
    subjectId: formData.get("subjectId"),
    day: formData.get("day"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const [schedule, subject] = await Promise.all([
      prisma.schedule.findFirst({
        where: {
          id: scheduleId,
          class: {
            schoolId: user.schoolId,
          },
        },
        select: {
          id: true,
        },
      }),
      findSubjectForSchedule(parsed.data.subjectId, user.schoolId),
    ]);

    if (!schedule) {
      return {
        success: false,
        message: "Schedule entry not found.",
      };
    }

    if (!subject) {
      return {
        success: false,
        message: "Selected subject is not available for this school.",
      };
    }

    const teacherIds = subject.teachers.map((teacher) => teacher.teacherId);
    const conflictMessage = await validateScheduleConflicts({
      classId: subject.classId,
      teacherIds,
      day: parsed.data.day,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      excludeScheduleId: schedule.id,
    });

    if (conflictMessage) {
      return {
        success: false,
        message: conflictMessage,
      };
    }

    await prisma.schedule.update({
      where: {
        id: schedule.id,
      },
      data: {
        classId: subject.classId,
        subjectId: subject.id,
        day: parsed.data.day,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
      },
    });

    revalidateSchedulePaths(schedule.id);

    return {
      success: true,
      message: "Timetable entry updated successfully.",
    };
  } catch (error) {
    console.error("Failed to update schedule entry:", error);
    return {
      success: false,
      message: "Failed to update timetable entry.",
    };
  }
}

export async function copyScheduleDayFormAction(
  _prevState: CopyScheduleFormState,
  formData: FormData,
): Promise<CopyScheduleFormState> {
  let user: SessionUser;

  try {
    user = await getAuthorizedAdmin();
  } catch {
    return {
      success: false,
      message: "Unauthorized request.",
    };
  }

  const parsed = copyScheduleDaySchema.safeParse({
    classId: formData.get("classId"),
    sourceDay: formData.get("sourceDay"),
    targetDay: formData.get("targetDay"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const classRecord = await prisma.class.findFirst({
      where: {
        id: parsed.data.classId,
        schoolId: user.schoolId,
      },
      select: {
        id: true,
      },
    });

    if (!classRecord) {
      return {
        success: false,
        message: "Selected class is not available for this school.",
      };
    }

    const sourceEntries = await prisma.schedule.findMany({
      where: {
        classId: classRecord.id,
        day: parsed.data.sourceDay,
      },
      orderBy: [{ startTime: "asc" }],
      include: {
        subject: {
          select: {
            classId: true,
            teachers: {
              select: {
                teacherId: true,
              },
            },
          },
        },
      },
    });

    if (sourceEntries.length === 0) {
      return {
        success: false,
        message: "There are no timetable slots on the source day to copy.",
      };
    }

    const targetCount = await prisma.schedule.count({
      where: {
        classId: classRecord.id,
        day: parsed.data.targetDay,
      },
    });

    if (targetCount > 0) {
      return {
        success: false,
        message: "The target day already has timetable entries. Clear it before copying.",
      };
    }

    for (const entry of sourceEntries) {
      const teacherIds = entry.subject.teachers.map((teacher) => teacher.teacherId);
      const conflictMessage = await validateScheduleConflicts({
        classId: classRecord.id,
        teacherIds,
        day: parsed.data.targetDay,
        startTime: entry.startTime,
        endTime: entry.endTime,
      });

      if (conflictMessage) {
        return {
          success: false,
          message: `Copy stopped because "${entry.startTime} - ${entry.endTime}" conflicts on the target day.`,
        };
      }
    }

    await prisma.schedule.createMany({
      data: sourceEntries.map((entry) => ({
        classId: classRecord.id,
        subjectId: entry.subjectId,
        day: parsed.data.targetDay,
        startTime: entry.startTime,
        endTime: entry.endTime,
      })),
    });

    revalidateSchedulePaths();

    return {
      success: true,
      message: "Day schedule copied successfully.",
    };
  } catch (error) {
    console.error("Failed to copy schedule day:", error);
    return {
      success: false,
      message: "Failed to copy timetable day.",
    };
  }
}

export async function deleteScheduleFormAction(formData: FormData) {
  const user = await getAuthorizedAdmin();

  const scheduleId = formData.get("scheduleId");

  if (typeof scheduleId !== "string" || scheduleId.length === 0) {
    throw new Error("Missing schedule id.");
  }

  const schedule = await prisma.schedule.findFirst({
    where: {
      id: scheduleId,
      class: {
        schoolId: user.schoolId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!schedule) {
    throw new Error("Schedule entry not found.");
  }

  await prisma.schedule.delete({
    where: {
      id: schedule.id,
    },
  });

  revalidateSchedulePaths(schedule.id);
}
