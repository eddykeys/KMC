"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createLessonPlan, generateLessonPlanWithAI } from "@/actions/lesson-plan-actions";
import prisma from "@/lib/prisma";
import { createLessonPlanSchema } from "@/lib/validators";
import type { SessionUser } from "@/types";

export interface TeacherLessonPlanFormState {
  success: boolean;
  message: string;
  errors?: Partial<Record<"title" | "topic" | "subjectId" | "termId", string[]>>;
}

export async function createTeacherLessonPlanFormAction(
  _prevState: TeacherLessonPlanFormState,
  formData: FormData
): Promise<TeacherLessonPlanFormState> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "TEACHER" || !user.teacherId) {
    return {
      success: false,
      message: "Unauthorized request.",
    };
  }

  const parsed = createLessonPlanSchema.safeParse({
    title: formData.get("title"),
    topic: formData.get("topic"),
    objectives: formData.get("objectives") || undefined,
    content: formData.get("content") || undefined,
    duration: formData.get("duration") || undefined,
    resources: formData.get("resources") || undefined,
    subjectId: formData.get("subjectId"),
    termId: formData.get("termId"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await createLessonPlan({
    ...parsed.data,
    teacherId: user.teacherId,
  });

  if (!result.success) {
    return {
      success: false,
      message: result.error || "Failed to create lesson plan.",
    };
  }

  revalidatePath("/teacher");
  revalidatePath("/teacher/lesson-plans");

  return {
    success: true,
    message: "Lesson plan created successfully.",
  };
}

export async function generateLessonPlanAiFormAction(
  lessonPlanId: string,
  _prevState: { success: boolean; message: string }
) {
  void _prevState;

  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "TEACHER" || !user.teacherId) {
    return {
      success: false,
      message: "Unauthorized request.",
    };
  }

  const lessonPlan = await prisma.lessonPlan.findFirst({
    where: {
      id: lessonPlanId,
      teacherId: user.teacherId,
    },
    include: {
      subject: {
        include: {
          class: {
            select: {
              level: true,
            },
          },
        },
      },
    },
  });

  if (!lessonPlan) {
    return {
      success: false,
      message: "Lesson plan not found.",
    };
  }

  if (lessonPlan.isAIGenerated) {
    return {
      success: true,
      message: "AI assets already exist for this lesson plan.",
    };
  }

  const result = await generateLessonPlanWithAI(
    {
      subject: lessonPlan.subject.name,
      topic: lessonPlan.topic,
      classLevel: lessonPlan.subject.class.level,
      objectives: lessonPlan.objectives || undefined,
      duration: lessonPlan.duration || undefined,
    },
    lessonPlanId
  );

  revalidatePath("/teacher");
  revalidatePath("/teacher/lesson-plans");

  return {
    success: !!result.success,
    message: result.success
      ? "AI lesson assets generated successfully."
      : result.error || "AI generation failed.",
  };
}
