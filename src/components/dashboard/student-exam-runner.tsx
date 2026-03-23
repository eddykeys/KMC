"use client";

import { useEffect, useMemo, useRef } from "react";
import { useExamProctoring } from "@/hooks/useExamProctoring";
import { logViolation } from "@/actions/exam-actions";
import type { ProctoringConfig } from "@/types";

interface StudentExamRunnerProps {
  examId: string;
  submissionId: string;
  studentId: string;
  questions: Array<{
    id: string;
    questionText: string;
    questionType: string;
    options: unknown;
    marks: number;
  }>;
  submitAction: (formData: FormData) => void | Promise<void>;
  proctoringConfig: ProctoringConfig;
}

export function StudentExamRunner({
  submissionId,
  studentId,
  questions,
  submitAction,
  proctoringConfig,
}: StudentExamRunnerProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const examConfig = useMemo(
    () => ({
      isEnabled: proctoringConfig.isEnabled,
      isWebcamRequired: proctoringConfig.isWebcamRequired,
      maxViolations: proctoringConfig.maxViolations,
    }),
    [proctoringConfig]
  );

  const proctoring = useExamProctoring({
    config: examConfig,
    submissionId,
    studentId,
    onAutoSubmit: () => formRef.current?.requestSubmit(),
    logViolationToServer: async (violation) => {
      await logViolation(violation);
    },
  });

  useEffect(() => {
    if (examConfig.isEnabled && examConfig.isWebcamRequired) {
      void proctoring.startWebcam();
    }
  }, [examConfig.isEnabled, examConfig.isWebcamRequired, proctoring]);

  return (
    <div className="grid gap-6">
      {examConfig.isEnabled ? (
        <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
          <p className="font-semibold">Exam mode is active.</p>
          <p className="mt-2">
            Violations: {proctoring.state.violationCount}/{examConfig.maxViolations}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void proctoring.enterFullscreen()}
              className="rounded-2xl border border-amber-200/20 bg-white/10 px-4 py-2 font-medium text-white transition hover:bg-white/15"
            >
              Enter fullscreen
            </button>
            {examConfig.isWebcamRequired ? (
              <button
                type="button"
                onClick={() => void proctoring.startWebcam()}
                className="rounded-2xl border border-amber-200/20 bg-white/10 px-4 py-2 font-medium text-white transition hover:bg-white/15"
              >
                Enable webcam
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <form ref={formRef} action={submitAction} className="grid gap-4">
        {questions.map((question, index) => {
          const options = Array.isArray(question.options)
            ? question.options.map((option) => String(option))
            : [];

          return (
            <article
              key={question.id}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
            >
              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                <span>Question {index + 1}</span>
                <span>{question.questionType}</span>
                <span>{question.marks} mark(s)</span>
              </div>
              <p className="mt-3 text-white">{question.questionText}</p>

              {options.length > 0 ? (
                <div className="mt-4 grid gap-2">
                  {options.map((option) => (
                    <label
                      key={`${question.id}-${option}`}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-stone-200"
                    >
                      <input type="radio" name={`answer_${question.id}`} value={option} />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  name={`answer_${question.id}`}
                  rows={4}
                  className="mt-4 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/50"
                  placeholder="Write your answer here"
                />
              )}
            </article>
          );
        })}

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200"
        >
          Submit Exam
        </button>
      </form>
    </div>
  );
}
