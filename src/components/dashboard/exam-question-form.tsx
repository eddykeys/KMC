"use client";

import { useActionState, useEffect, useRef } from "react";
import { createExamQuestionFormAction } from "@/app/(dashboard)/teacher/exams/[examId]/actions";
import type { ExamQuestionFormState } from "@/app/(dashboard)/teacher/exams/[examId]/actions";

const initialExamQuestionFormState: ExamQuestionFormState = {
  success: false,
  message: "",
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return <p className="mt-2 text-xs text-rose-300">{messages[0]}</p>;
}

export function ExamQuestionForm({ examId }: { examId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = createExamQuestionFormAction.bind(null, examId);
  const [state, formAction, pending] = useActionState(action, initialExamQuestionFormState);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Question Text</span>
            <textarea
              name="questionText"
              required
              rows={4}
              placeholder="Write the exam question here."
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-sky-300/50 focus:bg-white/10"
            />
          </label>
          <FieldError messages={state.errors?.questionText} />
        </div>

        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Question Type</span>
            <select
              name="questionType"
              defaultValue="MCQ"
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-sky-300/50"
            >
              <option value="MCQ">MCQ</option>
              <option value="WRITTEN">Written</option>
              <option value="TRUE_FALSE">True / False</option>
              <option value="FILL_IN_THE_BLANK">Fill in the blank</option>
            </select>
          </label>
          <FieldError messages={state.errors?.questionType} />
        </div>

        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Question Order</span>
          <input
            name="order"
            type="number"
            min={1}
            defaultValue={1}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-300/50 focus:bg-white/10"
          />
          <FieldError messages={state.errors?.order} />
        </label>

        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Marks</span>
          <input
            name="marks"
            type="number"
            min={1}
            defaultValue={1}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-300/50 focus:bg-white/10"
          />
        </label>

        <div className="md:col-span-2">
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Options</span>
            <textarea
              name="options"
              rows={4}
              placeholder="Enter one option per line for MCQ or True/False questions."
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-sky-300/50 focus:bg-white/10"
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Correct Answer</span>
          <input
            name="correctAnswer"
            placeholder="A / True / model answer"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-sky-300/50 focus:bg-white/10"
          />
        </label>

        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Image URL</span>
          <input
            name="imageUrl"
            type="url"
            placeholder="Optional"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-sky-300/50 focus:bg-white/10"
          />
        </label>
      </div>

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
        {pending ? "Saving question..." : "Add Question"}
      </button>
    </form>
  );
}
