"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createAnnouncementSchema } from "@/lib/validators";
import type { SessionUser } from "@/types";

export interface AnnouncementFormState {
  success: boolean;
  message: string;
  errors?: Partial<Record<"title" | "content" | "priority", string[]>>;
}

export async function createAnnouncementFormAction(
  _prevState: AnnouncementFormState,
  formData: FormData
): Promise<AnnouncementFormState> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "ADMIN") {
    return {
      success: false,
      message: "Unauthorized request.",
    };
  }

  const rawClassId = formData.get("classId");
  const rawExpiresAt = formData.get("expiresAt");

  const parsed = createAnnouncementSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    priority: Number(formData.get("priority") || 0),
    classId:
      typeof rawClassId === "string" && rawClassId.length > 0 ? rawClassId : undefined,
    schoolId: user.schoolId,
    expiresAt:
      typeof rawExpiresAt === "string" && rawExpiresAt.length > 0 ? rawExpiresAt : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  await prisma.announcement.create({
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      priority: parsed.data.priority,
      schoolId: parsed.data.schoolId,
      classId: parsed.data.classId || null,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      authorId: user.id,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/announcements");

  return {
    success: true,
    message: "Announcement published successfully.",
  };
}

export async function archiveAnnouncementFormAction(formData: FormData) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized request.");
  }

  const announcementId = formData.get("announcementId");

  if (typeof announcementId !== "string" || announcementId.length === 0) {
    throw new Error("Missing announcement id.");
  }

  await prisma.announcement.update({
    where: { id: announcementId },
    data: {
      isActive: false,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/announcements");
}
