"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createClassSchema } from "@/lib/validators";
import type { SessionUser } from "@/types";

export interface ClassFormState {
  success: boolean;
  message: string;
  errors?: Partial<Record<"name" | "level" | "classTeacherId", string[]>>;
}

export async function createClassFormAction(
  _prevState: ClassFormState,
  formData: FormData
): Promise<ClassFormState> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "ADMIN") {
    return {
      success: false,
      message: "Unauthorized request.",
    };
  }

  const rawClassTeacherId = formData.get("classTeacherId");

  const parsed = createClassSchema.safeParse({
    name: formData.get("name"),
    level: formData.get("level"),
    schoolId: user.schoolId,
    classTeacherId:
      typeof rawClassTeacherId === "string" && rawClassTeacherId.length > 0
        ? rawClassTeacherId
        : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    if (parsed.data.classTeacherId) {
      const assignedTeacher = await prisma.teacher.findFirst({
        where: {
          id: parsed.data.classTeacherId,
          user: { schoolId: user.schoolId },
        },
        select: {
          id: true,
          classTeacherOf: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!assignedTeacher) {
        return {
          success: false,
          message: "Selected teacher does not belong to this school.",
        };
      }

      if (assignedTeacher.classTeacherOf) {
        return {
          success: false,
          message: "Selected teacher is already assigned to another class.",
        };
      }
    }

    await prisma.class.create({
      data: {
        name: parsed.data.name,
        level: parsed.data.level,
        schoolId: parsed.data.schoolId,
        classTeacherId: parsed.data.classTeacherId,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/classes");

    return {
      success: true,
      message: "Class created successfully.",
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        message: "A class with this name already exists for the school.",
      };
    }

    console.error("Failed to create class:", error);
    return {
      success: false,
      message: "Failed to create class.",
    };
  }
}

export async function updateClassFormAction(
  classId: string,
  _prevState: ClassFormState,
  formData: FormData
): Promise<ClassFormState> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "ADMIN") {
    return {
      success: false,
      message: "Unauthorized request.",
    };
  }

  const rawClassTeacherId = formData.get("classTeacherId");

  const parsed = createClassSchema.safeParse({
    name: formData.get("name"),
    level: formData.get("level"),
    schoolId: user.schoolId,
    classTeacherId:
      typeof rawClassTeacherId === "string" && rawClassTeacherId.length > 0
        ? rawClassTeacherId
        : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    if (parsed.data.classTeacherId) {
      const assignedTeacher = await prisma.teacher.findFirst({
        where: {
          id: parsed.data.classTeacherId,
          user: { schoolId: user.schoolId },
        },
        select: {
          id: true,
          classTeacherOf: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!assignedTeacher) {
        return {
          success: false,
          message: "Selected teacher does not belong to this school.",
        };
      }

      if (assignedTeacher.classTeacherOf && assignedTeacher.classTeacherOf.id !== classId) {
        return {
          success: false,
          message: "Selected teacher is already assigned to another class.",
        };
      }
    }

    await prisma.class.update({
      where: { id: classId },
      data: {
        name: parsed.data.name,
        level: parsed.data.level,
        classTeacherId: parsed.data.classTeacherId || null,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/classes");
    revalidatePath(`/admin/classes/${classId}`);

    return {
      success: true,
      message: "Class updated successfully.",
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        message: "A class with this name already exists for the school.",
      };
    }

    console.error("Failed to update class:", error);
    return {
      success: false,
      message: "Failed to update class.",
    };
  }
}

export async function deleteClassFormAction(formData: FormData) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized request.");
  }

  const classId = formData.get("classId");

  if (typeof classId !== "string" || classId.length === 0) {
    throw new Error("Missing class id.");
  }

  await prisma.class.delete({
    where: { id: classId },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/classes");
}
