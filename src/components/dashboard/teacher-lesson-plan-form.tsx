"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTeacherLessonPlanFormAction } from "@/app/(dashboard)/teacher/lesson-plans/actions";
import type { TeacherLessonPlanFormState } from "@/app/(dashboard)/teacher/lesson-plans/actions";

const initialTeacherLessonPlanFormState: TeacherLessonPlanFormState = {
  success: false,
  message: "",
};

interface TeacherLessonPlanFormProps {
  subjects: Array<{
    id: string;
    name: string;
    className: string;
  }>;
  terms: Array<{
    id: string;
    name: string;
    sessionName: string;
  }>;
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;

  return <p className="mt-2 text-xs text-rose-300">{messages[0]}</p>;
}

export function TeacherLessonPlanForm({
  subjects,
  terms,
}: TeacherLessonPlanFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createTeacherLessonPlanFormAction,
    initialTeacherLessonPlanFormState
  );

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Lesson Title</span>
            <input
              name="title"
              required
              placeholder="Introduction to Algebraic Expressions"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-sky-300/50 focus:bg-white/10"
            />
          </label>
          <FieldError messages={state.errors?.title} />
        </div>

        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Topic</span>
            <input
              name="topic"
              required
              placeholder="Variables and constants"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-sky-300/50 focus:bg-white/10"
            />
          </label>
          <FieldError messages={state.errors?.topic} />
        </div>

        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Subject</span>
            <select
              name="subjectId"
              required
              defaultValue=""
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-sky-300/50"
            >
              <option value="" disabled>
                Select subject
              </option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} • {subject.className}
                </option>
              ))}
            </select>
          </label>
          <FieldError messages={state.errors?.subjectId} />
        </div>

        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Term</span>
            <select
              name="termId"
              required
              defaultValue=""
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-sky-300/50"
            >
              <option value="" disabled>
                Select term
              </option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name} • {term.sessionName}
                </option>
              ))}
            </select>
          </label>
          <FieldError messages={state.errors?.termId} />
        </div>

        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Duration</span>
          <input
            name="duration"
            placeholder="45 minutes"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-sky-300/50 focus:bg-white/10"
          />
        </label>

        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Resources</span>
          <input
            name="resources"
            placeholder="Whiteboard, workbook, projector"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-sky-300/50 focus:bg-white/10"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm text-stone-300">
        <span className="font-medium text-stone-200">Objectives</span>
        <textarea
          name="objectives"
          rows={3}
          placeholder="List the learning objectives for this lesson."
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-sky-300/50 focus:bg-white/10"
        />
      </label>

      <label className="grid gap-2 text-sm text-stone-300">
        <span className="font-medium text-stone-200">Lesson Content</span>
        <textarea
          name="content"
          rows={6}
          placeholder="Draft the lesson flow, examples, and teaching notes."
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-sky-300/50 focus:bg-white/10"
        />
      </label>

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
        {pending ? "Saving lesson plan..." : "Create Lesson Plan"}
      </button>
    </form>
  );
}
