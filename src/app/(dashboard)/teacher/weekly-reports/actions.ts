"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { SessionUser } from "@/types";

const weeklyReportSchema = z
  .object({
    weekStart: z.string().min(1, "Week start is required"),
    weekEnd: z.string().min(1, "Week end is required"),
    summary: z.string().min(1, "Summary is required"),
    challenges: z.string().optional(),
    plans: z.string().optional(),
    termId: z.string().min(1, "Term is required"),
  })
  .refine((data) => new Date(data.weekEnd) >= new Date(data.weekStart), {
    message: "Week end must be after week start.",
    path: ["weekEnd"],
  });

export interface WeeklyReportFormState {
  success: boolean;
  message: string;
  errors?: Partial<Record<"weekStart" | "weekEnd" | "summary" | "termId", string[]>>;
}

export async function createWeeklyReportFormAction(
  _prevState: WeeklyReportFormState,
  formData: FormData
): Promise<WeeklyReportFormState> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "TEACHER" || !user.teacherId) {
    return {
      success: false,
      message: "Unauthorized request.",
    };
  }

  const parsed = weeklyReportSchema.safeParse({
    weekStart: formData.get("weekStart"),
    weekEnd: formData.get("weekEnd"),
    summary: formData.get("summary"),
    challenges: formData.get("challenges") || undefined,
    plans: formData.get("plans") || undefined,
    termId: formData.get("termId"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  await prisma.weeklyReport.create({
    data: {
      weekStart: new Date(parsed.data.weekStart),
      weekEnd: new Date(parsed.data.weekEnd),
      summary: parsed.data.summary,
      challenges: parsed.data.challenges || null,
      plans: parsed.data.plans || null,
      teacherId: user.teacherId,
      termId: parsed.data.termId,
    },
  });

  revalidatePath("/teacher");
  revalidatePath("/teacher/weekly-reports");

  return {
    success: true,
    message: "Weekly report submitted successfully.",
  };
}
