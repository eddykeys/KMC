"use client";

import { useActionState } from "react";
import { generateLessonPlanAiFormAction } from "@/app/(dashboard)/teacher/lesson-plans/actions";

interface LessonPlanAiState {
  success: boolean;
  message: string;
}

const initialLessonPlanAiState: LessonPlanAiState = {
  success: false,
  message: "",
};

export function LessonPlanAiForm({
  lessonPlanId,
  disabled,
}: {
  lessonPlanId: string;
  disabled: boolean;
}) {
  const action = generateLessonPlanAiFormAction.bind(null, lessonPlanId);
  const [state, formAction, pending] = useActionState(action, initialLessonPlanAiState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <button
        type="submit"
        disabled={pending || disabled}
        className="inline-flex items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-300/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {disabled ? "AI assets ready" : pending ? "Generating AI assets..." : "Generate AI Assets"}
      </button>
      {state.message ? <p className="text-xs text-stone-400">{state.message}</p> : null}
    </form>
  );
}
