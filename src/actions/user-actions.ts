"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateAccessId } from "@/lib/utils";
import type { CreateStudentInput, CreateTeacherInput } from "@/lib/validators";

// ─────────────── Student Actions ───────────────

export async function createStudent(data: CreateStudentInput) {
  try {
    const school = await prisma.school.findUnique({
      where: { code: data.schoolCode },
    });
    if (!school) return { success: false, error: "School not found" };

    // Generate unique AccessID
    let accessId: string;
    let exists = true;
    do {
      accessId = generateAccessId(data.schoolCode);
      const check = await prisma.user.findUnique({ where: { accessId } });
      exists = !!check;
    } while (exists);

    const passwordHash = await bcrypt.hash(accessId, 12);

    const user = await prisma.user.create({
      data: {
        accessId,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        gender: data.gender,
        role: "STUDENT",
        schoolId: school.id,
        studentProfile: {
          create: {
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            address: data.address,
            parentName: data.parentName,
            parentEmail: data.parentEmail || null,
            parentPhone: data.parentPhone,
            classId: data.classId,
          },
        },
      },
      include: { studentProfile: true },
    });

    return { success: true, user, accessId };
  } catch (error) {
    console.error("Failed to create student:", error);
    return { success: false, error: "Failed to create student" };
  }
}

export async function bulkCreateStudents(
  students: CreateStudentInput[]
): Promise<{ success: boolean; created: number; errors: string[] }> {
  const results = { created: 0, errors: [] as string[] };

  for (const student of students) {
    const result = await createStudent(student);
    if (result.success) {
      results.created++;
    } else {
      results.errors.push(
        `${student.firstName} ${student.lastName}: ${result.error}`
      );
    }
  }

  return { success: results.errors.length === 0, ...results };
}

export async function deleteStudent(studentId: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { userId: true },
    });
    if (!student) return { success: false, error: "Student not found" };

    await prisma.user.delete({ where: { id: student.userId } });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete student:", error);
    return { success: false, error: "Failed to delete student" };
  }
}

export async function getStudents(schoolId: string, params?: {
  search?: string;
  classId?: string;
  gender?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {
    user: { schoolId },
  };

  if (params?.classId) where.classId = params.classId;
  if (params?.gender) where.user = { ...where.user as object, gender: params.gender };
  if (params?.search) {
    where.user = {
      ...where.user as object,
      OR: [
        { firstName: { contains: params.search, mode: "insensitive" } },
        { lastName: { contains: params.search, mode: "insensitive" } },
        { accessId: { contains: params.search, mode: "insensitive" } },
      ],
    };
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, middleName: true, gender: true, accessId: true, avatar: true, createdAt: true } },
        class: { select: { name: true, level: true } },
      },
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.student.count({ where }),
  ]);

  return {
    data: students,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ─────────────── Teacher Actions ───────────────

export async function createTeacher(data: CreateTeacherInput) {
  try {
    const school = await prisma.school.findUnique({
      where: { code: data.schoolCode },
    });
    if (!school) return { success: false, error: "School not found" };

    let accessId: string;
    let exists = true;
    do {
      accessId = generateAccessId(data.schoolCode);
      const check = await prisma.user.findUnique({ where: { accessId } });
      exists = !!check;
    } while (exists);

    const passwordHash = await bcrypt.hash(accessId, 12);

    const user = await prisma.user.create({
      data: {
        accessId,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        email: data.email || null,
        gender: data.gender,
        phone: data.phone,
        role: "TEACHER",
        schoolId: school.id,
        teacherProfile: {
          create: {
            qualification: data.qualification,
            specialization: data.specialization,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            address: data.address,
          },
        },
      },
      include: { teacherProfile: true },
    });

    return { success: true, user, accessId };
  } catch (error) {
    console.error("Failed to create teacher:", error);
    return { success: false, error: "Failed to create teacher" };
  }
}

export async function getTeachers(schoolId: string, params?: {
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {
    user: { schoolId, role: "TEACHER" },
  };

  if (params?.search) {
    where.user = {
      ...where.user as object,
      OR: [
        { firstName: { contains: params.search, mode: "insensitive" } },
        { lastName: { contains: params.search, mode: "insensitive" } },
        { accessId: { contains: params.search, mode: "insensitive" } },
      ],
    };
  }

  const [teachers, total] = await Promise.all([
    prisma.teacher.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, gender: true, accessId: true, avatar: true, email: true, phone: true } },
        classTeacherOf: { select: { name: true, level: true } },
        subjects: { include: { subject: { select: { name: true } } } },
      },
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.teacher.count({ where }),
  ]);

  return {
    data: teachers,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
