"use client";

import { useActionState } from "react";
import { gradeSubmissionFormAction } from "@/app/(dashboard)/teacher/exams/[examId]/submissions/[submissionId]/actions";
import type { SubmissionGradingFormState } from "@/app/(dashboard)/teacher/exams/[examId]/submissions/[submissionId]/actions";

const initialSubmissionGradingState: SubmissionGradingFormState = {
  success: false,
  message: "",
};

interface SubmissionGradingFormProps {
  examId: string;
  submissionId: string;
  answers: Array<{
    id: string;
    answer: string | null;
    marksObtained: number | null;
    isCorrect: boolean | null;
    question: {
      id: string;
      questionText: string;
      questionType: string;
      marks: number;
      correctAnswer: string | null;
      options: unknown;
    };
  }>;
}

export function SubmissionGradingForm({
  examId,
  submissionId,
  answers,
}: SubmissionGradingFormProps) {
  const boundAction = gradeSubmissionFormAction.bind(null, examId, submissionId);
  const [state, formAction, pending] = useActionState(
    boundAction,
    initialSubmissionGradingState
  );

  return (
    <form action={formAction} className="grid gap-4">
      {answers.map((answer, index) => {
        const options = Array.isArray(answer.question.options)
          ? answer.question.options.map((option) => String(option))
          : [];

        return (
          <article
            key={answer.id}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
          >
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
              <span>Question {index + 1}</span>
              <span>{answer.question.questionType}</span>
              <span>{answer.question.marks} mark(s)</span>
            </div>
            <p className="mt-3 font-medium text-white">{answer.question.questionText}</p>
            {options.length > 0 ? (
              <div className="mt-4 grid gap-2">
                {options.map((option) => (
                  <div
                    key={`${answer.question.id}-${option}`}
                    className={`rounded-2xl border px-4 py-2 text-sm ${
                      answer.answer === option
                        ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                        : "border-white/10 bg-white/[0.03] text-stone-300"
                    }`}
                  >
                    {option}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-stone-300">
                {answer.answer?.length ? answer.answer : "No answer submitted."}
              </div>
              <label className="grid gap-2 text-sm text-stone-300 lg:w-40">
                <span className="font-medium text-stone-200">Marks awarded</span>
                <input
                  name={`marks_${answer.id}`}
                  type="number"
                  min={0}
                  max={answer.question.marks}
                  step="0.5"
                  defaultValue={answer.marksObtained ?? 0}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-300/50 focus:bg-white/10"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
              {answer.question.correctAnswer ? (
                <span>Expected: {answer.question.correctAnswer}</span>
              ) : null}
              {answer.isCorrect === true ? <span>Marked correct</span> : null}
              {answer.isCorrect === false ? <span>Marked incorrect</span> : null}
            </div>
          </article>
        );
      })}

      {state.message ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            state.success
              ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
              : "border-rose-300/20 bg-rose-400/10 text-rose-100"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-2xl bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving grades..." : "Save Grades"}
      </button>
    </form>
  );
}
