"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createTeacherSchema } from "@/lib/validators";
import { updateTeacher } from "@/actions/user-actions";
import type { SessionUser } from "@/types";

export interface EditTeacherFormState {
  success: boolean;
  message: string;
  errors?: Partial<Record<"firstName" | "lastName" | "email" | "gender", string[]>>;
}

export async function updateTeacherFormAction(
  teacherId: string,
  _prevState: EditTeacherFormState,
  formData: FormData
): Promise<EditTeacherFormState> {
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

  const result = await updateTeacher(teacherId, parsed.data);

  if (!result.success) {
    return {
      success: false,
      message: result.error || "Failed to update teacher.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/teachers");
  revalidatePath(`/admin/teachers/${teacherId}`);

  return {
    success: true,
    message: "Teacher profile updated successfully.",
  };
}
