"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createStudentSchema } from "@/lib/validators";
import { createStudent, deleteStudent } from "@/actions/user-actions";
import type { SessionUser } from "@/types";

export interface StudentFormState {
  success: boolean;
  message: string;
  accessId?: string;
  errors?: Partial<
    Record<
      | "firstName"
      | "lastName"
      | "gender"
      | "classId"
      | "parentEmail",
      string[]
    >
  >;
}

export async function createStudentFormAction(
  _prevState: StudentFormState,
  formData: FormData
): Promise<StudentFormState> {
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

  const result = await createStudent(parsed.data);

  if (!result.success) {
    return {
      success: false,
      message: result.error || "Failed to create student.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/students");

  return {
    success: true,
    message: "Student account created successfully.",
    accessId: result.accessId,
  };
}

export async function deleteStudentFormAction(formData: FormData) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized request.");
  }

  const studentId = formData.get("studentId");

  if (typeof studentId !== "string" || studentId.length === 0) {
    throw new Error("Missing student id.");
  }

  await deleteStudent(studentId);
  revalidatePath("/admin");
  revalidatePath("/admin/students");
}
