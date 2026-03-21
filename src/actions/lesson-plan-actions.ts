"use server";

import prisma from "@/lib/prisma";
import type { AILessonPlanInput, CreateLessonPlanInput } from "@/lib/validators";
import type { LessonPlanAssetType } from "@prisma/client";

// ─────────────── Lesson Plan CRUD ───────────────

export async function createLessonPlan(data: CreateLessonPlanInput & { teacherId: string }) {
  try {
    const plan = await prisma.lessonPlan.create({
      data: {
        title: data.title,
        topic: data.topic,
        objectives: data.objectives,
        content: data.content,
        duration: data.duration,
        resources: data.resources,
        teacherId: data.teacherId,
        subjectId: data.subjectId,
        termId: data.termId,
      },
    });
    return { success: true, plan };
  } catch (error) {
    console.error("Failed to create lesson plan:", error);
    return { success: false, error: "Failed to create lesson plan" };
  }
}

export async function getLessonPlans(params: {
  teacherId?: string;
  subjectId?: string;
  termId?: string;
}) {
  const plans = await prisma.lessonPlan.findMany({
    where: {
      ...(params.teacherId && { teacherId: params.teacherId }),
      ...(params.subjectId && { subjectId: params.subjectId }),
      ...(params.termId && { termId: params.termId }),
    },
    include: {
      subject: { select: { name: true, code: true } },
      teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
      aiAssets: { select: { id: true, type: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return plans;
}

// ─────────────── AI Generation ───────────────

export async function generateLessonPlanWithAI(
  input: AILessonPlanInput,
  lessonPlanId: string
) {
  try {
    const { OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are an expert Nigerian curriculum-aligned education content creator. 
Generate comprehensive lesson plan content for ${input.classLevel} level.
All content must be appropriate for Nigerian secondary school students.
Use British English spelling conventions.
Format output as valid JSON.`;

    const userPrompt = `Generate complete lesson plan content for:
Subject: ${input.subject}
Topic: ${input.topic}
Class Level: ${input.classLevel}
${input.objectives ? `Learning Objectives: ${input.objectives}` : ""}
${input.duration ? `Duration: ${input.duration}` : ""}

Generate ALL of the following in a single JSON response:
{
  "notes": "Detailed lesson notes in markdown (at least 500 words covering introduction, body, and conclusion)",
  "mcqs": [
    { "question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": "A", "explanation": "..." }
  ],
  "flashcards": [
    { "front": "Term or question", "back": "Definition or answer" }
  ],
  "podcastScript": "A conversational podcast script (2 speakers: Host and Expert) covering the topic in an engaging way, ready for text-to-speech. At least 800 words.",
  "writtenTest": "A written test with 5 short-answer questions and 3 essay questions in markdown format",
  "tutorLesson": "An interactive tutor-style lesson in markdown with step-by-step explanations, examples, practice problems, and checkpoints",
  "summary": "A concise 200-word summary of the entire topic"
}

IMPORTANT: Generate exactly 20 MCQs and 50 flashcards. Make all content grade-appropriate for ${input.classLevel}.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 8000,
    });

    const content = JSON.parse(response.choices[0]?.message?.content || "{}");

    // Save each asset type to the database
    const assetTypes: { type: LessonPlanAssetType; content: string }[] = [
      { type: "NOTES", content: content.notes || "" },
      { type: "MCQ", content: JSON.stringify(content.mcqs || []) },
      { type: "FLASHCARDS", content: JSON.stringify(content.flashcards || []) },
      { type: "PODCAST_SCRIPT", content: content.podcastScript || "" },
      { type: "WRITTEN_TEST", content: content.writtenTest || "" },
      { type: "TUTOR_LESSON", content: content.tutorLesson || "" },
      { type: "SUMMARY", content: content.summary || "" },
    ];

    const assets = await Promise.all(
      assetTypes.map((asset) =>
        prisma.lessonPlanAIAsset.create({
          data: {
            type: asset.type,
            content: asset.content,
            lessonPlanId,
          },
        })
      )
    );

    // Mark lesson plan as AI generated
    await prisma.lessonPlan.update({
      where: { id: lessonPlanId },
      data: { isAIGenerated: true },
    });

    return { success: true, assets, content };
  } catch (error) {
    console.error("AI generation failed:", error);
    return { success: false, error: "AI content generation failed" };
  }
}
