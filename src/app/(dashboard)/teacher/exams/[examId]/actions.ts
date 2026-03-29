"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createQuestionSchema } from "@/lib/validators";
import { logActionFailure, logActionSuccess } from "@/lib/action-telemetry";
import type { SessionUser } from "@/types";

export interface ExamQuestionFormState {
  success: boolean;
  message: string;
  errors?: Partial<Record<"questionText" | "questionType" | "order", string[]>>;
}

export async function createExamQuestionFormAction(
  examId: string,
  _prevState: ExamQuestionFormState,
  formData: FormData
): Promise<ExamQuestionFormState> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "TEACHER" || !user.teacherId) {
    return {
      success: false,
      message: "Unauthorized request.",
    };
  }

  const parsed = createQuestionSchema.safeParse({
    examId,
    questionText: formData.get("questionText"),
    questionType: formData.get("questionType"),
    options: String(formData.get("options") || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    correctAnswer: formData.get("correctAnswer") || undefined,
    marks: Number(formData.get("marks") || 1),
    order: Number(formData.get("order") || 1),
    imageUrl: formData.get("imageUrl") || "",
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const exam = await prisma.exam.findFirst({
    where: {
      id: examId,
      teacherId: user.teacherId,
    },
    select: { id: true },
  });

  if (!exam) {
    logActionFailure(
      {
        action: "teacher.exam.question.create",
        actorRole: user.role,
        actorId: user.id,
        schoolId: user.schoolId,
        targetId: examId,
      },
      "Exam not found for this teacher."
    );
    return {
      success: false,
      message: "Exam not found for this teacher.",
    };
  }

  await prisma.examQuestion.create({
    data: {
      examId,
      questionText: parsed.data.questionText,
      questionType: parsed.data.questionType,
      options: parsed.data.options && parsed.data.options.length > 0 ? parsed.data.options : undefined,
      correctAnswer: parsed.data.correctAnswer,
      marks: parsed.data.marks,
      order: parsed.data.order,
      imageUrl: parsed.data.imageUrl || null,
    },
  });

  revalidatePath(`/teacher/exams/${examId}`);
  revalidatePath("/teacher/exams");

  logActionSuccess({
    action: "teacher.exam.question.create",
    actorRole: user.role,
    actorId: user.id,
    schoolId: user.schoolId,
    targetId: examId,
  });

  return {
    success: true,
    message: "Question added successfully.",
  };
}

export async function toggleExamPublishFormAction(formData: FormData) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "TEACHER" || !user.teacherId) {
    throw new Error("Unauthorized request.");
  }

  const examId = formData.get("examId");

  if (typeof examId !== "string" || examId.length === 0) {
    throw new Error("Missing exam id.");
  }

  const exam = await prisma.exam.findFirst({
    where: {
      id: examId,
      teacherId: user.teacherId,
    },
    select: {
      id: true,
      isPublished: true,
    },
  });

  if (!exam) {
    throw new Error("Exam not found.");
  }

  await prisma.exam.update({
    where: { id: examId },
    data: { isPublished: !exam.isPublished },
  });

  revalidatePath(`/teacher/exams/${examId}`);
  revalidatePath("/teacher/exams");
  revalidatePath("/student");

  logActionSuccess({
    action: "teacher.exam.publish.toggle",
    actorRole: user.role,
    actorId: user.id,
    schoolId: user.schoolId,
    targetId: examId,
    details: {
      isPublished: !exam.isPublished,
    },
  });
}
