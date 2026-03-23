"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createStudentSchema } from "@/lib/validators";
import { updateStudent } from "@/actions/user-actions";
import type { SessionUser } from "@/types";

export interface EditStudentFormState {
  success: boolean;
  message: string;
  errors?: Partial<
    Record<"firstName" | "lastName" | "gender" | "classId" | "parentEmail", string[]>
  >;
}

export async function updateStudentFormAction(
  studentId: string,
  _prevState: EditStudentFormState,
  formData: FormData
): Promise<EditStudentFormState> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "ADMIN") {
    return {
      success: false,
      message: "Unauthorized request.",
    };
  }

  const parsed = createStudentSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    middleName: formData.get("middleName") || undefined,
    gender: formData.get("gender"),
    dateOfBirth: formData.get("dateOfBirth") || undefined,
    address: formData.get("address") || undefined,
    parentName: formData.get("parentName") || undefined,
    parentEmail: formData.get("parentEmail") || "",
    parentPhone: formData.get("parentPhone") || undefined,
    classId: formData.get("classId"),
    schoolCode: user.schoolCode,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await updateStudent(studentId, parsed.data);

  if (!result.success) {
    return {
      success: false,
      message: result.error || "Failed to update student.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${studentId}`);

  return {
    success: true,
    message: "Student profile updated successfully.",
  };
}
