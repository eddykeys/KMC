"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { markAttendanceSchema } from "@/lib/validators";
import type { SessionUser } from "@/types";

export interface AttendanceFormState {
  success: boolean;
  message: string;
}

export async function markClassAttendanceFormAction(
  classId: string,
  _prevState: AttendanceFormState,
  formData: FormData
): Promise<AttendanceFormState> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "TEACHER" || !user.teacherId) {
    return {
      success: false,
      message: "Unauthorized request.",
    };
  }

  const classRecord = await prisma.class.findFirst({
    where: {
      id: classId,
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
    include: {
      students: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!classRecord) {
    return {
      success: false,
      message: "This class is not available for attendance under your account.",
    };
  }

  const records = classRecord.students.map((student) => ({
    studentId: student.id,
    status: String(formData.get(`status_${student.id}`) || "PRESENT"),
    note: String(formData.get(`note_${student.id}`) || ""),
  }));

  const parsed = markAttendanceSchema.safeParse({
    date: formData.get("date"),
    termId: formData.get("termId"),
    classId,
    records,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please review the attendance form and try again.",
    };
  }

  const attendanceDate = new Date(parsed.data.date);

  for (const record of parsed.data.records) {
    await prisma.attendance.upsert({
      where: {
        date_studentId_classId: {
          date: attendanceDate,
          studentId: record.studentId,
          classId,
        },
      },
      update: {
        status: record.status,
        note: record.note || null,
        termId: parsed.data.termId,
        teacherId: user.teacherId,
      },
      create: {
        date: attendanceDate,
        status: record.status,
        note: record.note || null,
        studentId: record.studentId,
        classId,
        termId: parsed.data.termId,
        teacherId: user.teacherId,
      },
    });
  }

  revalidatePath("/teacher");
  revalidatePath("/teacher/attendance");

  return {
    success: true,
    message: `Attendance saved for ${classRecord.name}.`,
  };
}
