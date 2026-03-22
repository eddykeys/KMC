"use server";

import prisma from "@/lib/prisma";
import { Prisma, type ViolationType } from "@prisma/client";

export async function logViolation(data: {
  type: ViolationType;
  description: string;
  submissionId: string;
  studentId: string;
  screenshotUrl?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const violation = await prisma.violationLog.create({
      data: {
        type: data.type,
        description: data.description,
        screenshotUrl: data.screenshotUrl,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
        studentId: data.studentId,
        submissionId: data.submissionId,
      },
    });

    // Check total violations for auto-submit
    const totalViolations = await prisma.violationLog.count({
      where: { submissionId: data.submissionId },
    });

    const submission = await prisma.examSubmission.findUnique({
      where: { id: data.submissionId },
      include: { exam: { select: { maxViolations: true } } },
    });

    if (submission && totalViolations >= submission.exam.maxViolations) {
      await prisma.examSubmission.update({
        where: { id: data.submissionId },
        data: {
          isAutoSubmitted: true,
          submittedAt: new Date(),
        },
      });
    }

    return { success: true, violation, totalViolations };
  } catch (error) {
    console.error("Failed to log violation:", error);
    return { success: false, error: "Failed to log violation" };
  }
}

export async function getViolationsBySubmission(submissionId: string) {
  try {
    const violations = await prisma.violationLog.findMany({
      where: { submissionId },
      orderBy: { timestamp: "desc" },
    });
    return { success: true, violations };
  } catch (error) {
    console.error("Failed to fetch violations:", error);
    return { success: false, error: "Failed to fetch violations" };
  }
}
