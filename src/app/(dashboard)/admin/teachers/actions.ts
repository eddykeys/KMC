"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createTeacherSchema } from "@/lib/validators";
import { createTeacher, deleteTeacher } from "@/actions/user-actions";
import type { SessionUser } from "@/types";

export interface TeacherFormState {
  success: boolean;
  message: string;
  accessId?: string;
  errors?: Partial<Record<"firstName" | "lastName" | "email" | "gender", string[]>>;
}

export async function createTeacherFormAction(
  _prevState: TeacherFormState,
  formData: FormData
): Promise<TeacherFormState> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "ADMIN") {
    return {
      success: false,
      message: "Unauthorized request.",
    };
  }

  const parsed = createTeacherSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    middleName: formData.get("middleName") || undefined,
    email: formData.get("email") || "",
    gender: formData.get("gender"),
    phone: formData.get("phone") || undefined,
    qualification: formData.get("qualification") || undefined,
    specialization: formData.get("specialization") || undefined,
    dateOfBirth: formData.get("dateOfBirth") || undefined,
    address: formData.get("address") || undefined,
    schoolCode: user.schoolCode,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await createTeacher(parsed.data);

  if (!result.success) {
    return {
      success: false,
      message: result.error || "Failed to create teacher.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/teachers");

  return {
    success: true,
    message: "Teacher account created successfully.",
    accessId: result.accessId,
  };
}

export async function deleteTeacherFormAction(formData: FormData) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized request.");
  }

  const teacherId = formData.get("teacherId");

  if (typeof teacherId !== "string" || teacherId.length === 0) {
    throw new Error("Missing teacher id.");
  }

  await deleteTeacher(teacherId);
  revalidatePath("/admin");
  revalidatePath("/admin/teachers");
}
