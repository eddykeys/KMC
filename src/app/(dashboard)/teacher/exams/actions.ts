"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createExamSchema } from "@/lib/validators";
import { logActionFailure, logActionSuccess } from "@/lib/action-telemetry";
import type { SessionUser } from "@/types";

export interface TeacherExamFormState {
  success: boolean;
  message: string;
  errors?: Partial<Record<"title" | "subjectId" | "classId" | "termId", string[]>>;
}

export async function createTeacherExamFormAction(
  _prevState: TeacherExamFormState,
  formData: FormData
): Promise<TeacherExamFormState> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "TEACHER" || !user.teacherId) {
    return {
      success: false,
      message: "Unauthorized request.",
    };
  }

  const parsed = createExamSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    subjectId: formData.get("subjectId"),
    classId: formData.get("classId"),
    termId: formData.get("termId"),
    duration: Number(formData.get("duration") || 0),
    totalMarks: Number(formData.get("totalMarks") || 0),
    passingMarks: formData.get("passingMarks")
      ? Number(formData.get("passingMarks"))
      : undefined,
    instructions: formData.get("instructions") || undefined,
    isProctoringEnabled: formData.get("isProctoringEnabled") === "on",
    isWebcamRequired: formData.get("isWebcamRequired") === "on",
    maxViolations: Number(formData.get("maxViolations") || 3),
    shuffleQuestions: formData.get("shuffleQuestions") !== "off",
    startTime: formData.get("startTime") || undefined,
    endTime: formData.get("endTime") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const subjectAssignment = await prisma.subjectTeacher.findFirst({
    where: {
      teacherId: user.teacherId,
      subjectId: parsed.data.subjectId,
      subject: {
        classId: parsed.data.classId,
      },
    },
    select: {
      id: true,
      subject: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!subjectAssignment) {
    logActionFailure(
      {
        action: "teacher.exam.create",
        actorRole: user.role,
        actorId: user.id,
        schoolId: user.schoolId,
      },
      "Selected subject and class are not assigned to this teacher."
    );
    return {
      success: false,
      message: "Selected subject and class are not assigned to this teacher.",
    };
  }

  try {
    await prisma.exam.create({
      data: {
        title: parsed.data.title,
        type: parsed.data.type,
        subjectId: parsed.data.subjectId,
        classId: parsed.data.classId,
        teacherId: user.teacherId,
        termId: parsed.data.termId,
        duration: parsed.data.duration,
        totalMarks: parsed.data.totalMarks,
        passingMarks: parsed.data.passingMarks,
        instructions: parsed.data.instructions,
        isProctoringEnabled: parsed.data.isProctoringEnabled,
        isWebcamRequired: parsed.data.isWebcamRequired,
        maxViolations: parsed.data.maxViolations,
        shuffleQuestions: parsed.data.shuffleQuestions,
        startTime: parsed.data.startTime ? new Date(parsed.data.startTime) : null,
        endTime: parsed.data.endTime ? new Date(parsed.data.endTime) : null,
      },
    });

    revalidatePath("/teacher");
    revalidatePath("/teacher/exams");

    logActionSuccess({
      action: "teacher.exam.create",
      actorRole: user.role,
      actorId: user.id,
      schoolId: user.schoolId,
      details: {
        subjectId: parsed.data.subjectId,
        classId: parsed.data.classId,
        termId: parsed.data.termId,
      },
    });

    return {
      success: true,
      message: "Exam created successfully.",
    };
  } catch (error) {
    logActionFailure(
      {
        action: "teacher.exam.create",
        actorRole: user.role,
        actorId: user.id,
        schoolId: user.schoolId,
      },
      error
    );
    return {
      success: false,
      message: "Failed to create exam.",
    };
  }
}
