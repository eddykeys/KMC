"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { SessionUser } from "@/types";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm the new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export interface ChangePasswordFormState {
  success: boolean;
  message: string;
  errors?: Partial<Record<"currentPassword" | "newPassword" | "confirmPassword", string[]>>;
}

export async function changePasswordFormAction(
  _prevState: ChangePasswordFormState,
  formData: FormData
): Promise<ChangePasswordFormState> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user) {
    return {
      success: false,
      message: "Unauthorized request.",
    };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!dbUser) {
    return {
      success: false,
      message: "User not found.",
    };
  }

  const isValid = await bcrypt.compare(parsed.data.currentPassword, dbUser.passwordHash);

  if (!isValid) {
    return {
      success: false,
      message: "Current password is incorrect.",
      errors: {
        currentPassword: ["Current password is incorrect."],
      },
    };
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return {
      success: false,
      message: "Choose a new password different from the current one.",
      errors: {
        newPassword: ["Choose a different password."],
      },
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
    },
  });

  return {
    success: true,
    message: "Password updated successfully. Please sign in again.",
  };
}
