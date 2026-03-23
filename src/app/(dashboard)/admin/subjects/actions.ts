"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createSubjectSchema } from "@/lib/validators";
import type { SessionUser } from "@/types";

export interface SubjectFormState {
  success: boolean;
  message: string;
  errors?: Partial<Record<"name" | "classId" | "code", string[]>>;
}

export async function createSubjectFormAction(
  _prevState: SubjectFormState,
  formData: FormData
): Promise<SubjectFormState> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "ADMIN") {
    return {
      success: false,
      message: "Unauthorized request.",
    };
  }

  const rawTeacherId = formData.get("teacherId");

  const parsed = createSubjectSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code") || undefined,
    classId: formData.get("classId"),
    schoolId: user.schoolId,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const teacherId =
    typeof rawTeacherId === "string" && rawTeacherId.length > 0 ? rawTeacherId : undefined;

  try {
    if (teacherId) {
      const teacher = await prisma.teacher.findFirst({
        where: {
          id: teacherId,
          user: { schoolId: user.schoolId },
        },
        select: { id: true },
      });

      if (!teacher) {
        return {
          success: false,
          message: "Selected teacher does not belong to this school.",
        };
      }
    }

    await prisma.subject.create({
      data: {
        name: parsed.data.name,
        code: parsed.data.code || null,
        classId: parsed.data.classId,
        schoolId: parsed.data.schoolId,
        teachers: teacherId
          ? {
              create: {
                teacherId,
              },
            }
          : undefined,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/subjects");
    revalidatePath("/admin/classes");
    revalidatePath("/admin/teachers");

    return {
      success: true,
      message: "Subject created successfully.",
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        message: "A subject with this name already exists for the selected class.",
      };
    }

    console.error("Failed to create subject:", error);
    return {
      success: false,
      message: "Failed to create subject.",
    };
  }
}

export async function updateSubjectFormAction(
  subjectId: string,
  _prevState: SubjectFormState,
  formData: FormData
): Promise<SubjectFormState> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "ADMIN") {
    return {
      success: false,
      message: "Unauthorized request.",
    };
  }

  const parsed = createSubjectSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code") || undefined,
    classId: formData.get("classId"),
    schoolId: user.schoolId,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.subject.update({
      where: { id: subjectId },
      data: {
        name: parsed.data.name,
        code: parsed.data.code || null,
        classId: parsed.data.classId,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/subjects");
    revalidatePath(`/admin/subjects/${subjectId}`);

    return {
      success: true,
      message: "Subject updated successfully.",
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        message: "A subject with this name already exists for the selected class.",
      };
    }

    console.error("Failed to update subject:", error);
    return {
      success: false,
      message: "Failed to update subject.",
    };
  }
}

export async function deleteSubjectFormAction(formData: FormData) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized request.");
  }

  const subjectId = formData.get("subjectId");

  if (typeof subjectId !== "string" || subjectId.length === 0) {
    throw new Error("Missing subject id.");
  }

  await prisma.subject.delete({
    where: { id: subjectId },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/subjects");
  revalidatePath("/admin/classes");
  revalidatePath("/admin/teachers");
}

export async function assignTeacherToSubjectFormAction(formData: FormData) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized request.");
  }

  const subjectId = formData.get("subjectId");
  const teacherId = formData.get("teacherId");

  if (typeof subjectId !== "string" || subjectId.length === 0) {
    throw new Error("Missing subject id.");
  }

  if (typeof teacherId !== "string" || teacherId.length === 0) {
    throw new Error("Missing teacher id.");
  }

  const [subject, teacher] = await Promise.all([
    prisma.subject.findFirst({
      where: {
        id: subjectId,
        schoolId: user.schoolId,
      },
      select: { id: true },
    }),
    prisma.teacher.findFirst({
      where: {
        id: teacherId,
        user: { schoolId: user.schoolId },
      },
      select: { id: true },
    }),
  ]);

  if (!subject || !teacher) {
    throw new Error("Invalid subject or teacher selection.");
  }

  try {
    await prisma.subjectTeacher.create({
      data: {
        subjectId,
        teacherId,
      },
    });
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
    ) {
      throw error;
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/subjects");
  revalidatePath("/admin/classes");
  revalidatePath("/admin/teachers");
}

export async function removeTeacherFromSubjectFormAction(formData: FormData) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized request.");
  }

  const assignmentId = formData.get("assignmentId");

  if (typeof assignmentId !== "string" || assignmentId.length === 0) {
    throw new Error("Missing assignment id.");
  }

  const assignment = await prisma.subjectTeacher.findFirst({
    where: {
      id: assignmentId,
      subject: { schoolId: user.schoolId },
    },
    select: { id: true },
  });

  if (!assignment) {
    throw new Error("Subject assignment not found.");
  }

  await prisma.subjectTeacher.delete({
    where: { id: assignmentId },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/subjects");
  revalidatePath("/admin/classes");
  revalidatePath("/admin/teachers");
}
