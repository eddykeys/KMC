"use server";

import { revalidatePath } from "next/cache";
import { PaymentStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createFeeSchema } from "@/lib/validators";
import type { SessionUser } from "@/types";

export interface FeeFormState {
  success: boolean;
  message: string;
  errors?: Partial<Record<"name" | "amount" | "termId" | "level", string[]>>;
}

export interface PaymentFormState {
  success: boolean;
  message: string;
  errors?: Partial<Record<"studentId" | "feeId" | "amount", string[]>>;
}

export async function createFeeFormAction(
  _prevState: FeeFormState,
  formData: FormData
): Promise<FeeFormState> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "ADMIN") {
    return { success: false, message: "Unauthorized request." };
  }

  const rawLevel = formData.get("level");
  const rawDueDate = formData.get("dueDate");

  const parsed = createFeeSchema.safeParse({
    name: formData.get("name"),
    amount: Number(formData.get("amount") || 0),
    description: formData.get("description") || undefined,
    dueDate: typeof rawDueDate === "string" && rawDueDate.length > 0 ? rawDueDate : undefined,
    level: typeof rawLevel === "string" && rawLevel.length > 0 ? rawLevel : undefined,
    schoolId: user.schoolId,
    termId: formData.get("termId"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  await prisma.fee.create({
    data: {
      name: parsed.data.name,
      amount: parsed.data.amount,
      description: parsed.data.description || null,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      level: parsed.data.level ?? null,
      schoolId: user.schoolId,
      termId: parsed.data.termId,
    },
  });

  revalidatePath("/admin/fees");
  revalidatePath("/student/fees");

  return {
    success: true,
    message: "Fee created successfully.",
  };
}

export async function recordPaymentFormAction(
  _prevState: PaymentFormState,
  formData: FormData
): Promise<PaymentFormState> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "ADMIN") {
    return { success: false, message: "Unauthorized request." };
  }

  const studentId = formData.get("studentId");
  const feeId = formData.get("feeId");
  const amount = Number(formData.get("amount") || 0);
  const method = formData.get("method");
  const reference = formData.get("reference");

  if (typeof studentId !== "string" || studentId.length === 0) {
    return {
      success: false,
      message: "Student is required.",
      errors: { studentId: ["Student is required."] },
    };
  }

  if (typeof feeId !== "string" || feeId.length === 0) {
    return {
      success: false,
      message: "Fee is required.",
      errors: { feeId: ["Fee is required."] },
    };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      success: false,
      message: "Payment amount must be greater than zero.",
      errors: { amount: ["Amount must be greater than zero."] },
    };
  }

  const fee = await prisma.fee.findFirst({
    where: {
      id: feeId,
      schoolId: user.schoolId,
    },
    include: {
      payments: {
        where: { studentId },
        select: { amount: true },
      },
    },
  });

  if (!fee) {
    return { success: false, message: "Fee not found." };
  }

  const totalPaid = fee.payments.reduce((sum, payment) => sum + payment.amount, 0) + amount;
  let status: PaymentStatus = PaymentStatus.PARTIAL;

  if (totalPaid >= fee.amount) {
    status = PaymentStatus.PAID;
  } else if (totalPaid <= 0) {
    status = PaymentStatus.PENDING;
  }

  await prisma.payment.create({
    data: {
      studentId,
      feeId,
      amount,
      status,
      method: typeof method === "string" && method.length > 0 ? method : null,
      reference: typeof reference === "string" && reference.length > 0 ? reference : null,
      paidAt: new Date(),
    },
  });

  revalidatePath("/admin/fees");
  revalidatePath("/student/fees");

  return {
    success: true,
    message: "Payment recorded successfully.",
  };
}
