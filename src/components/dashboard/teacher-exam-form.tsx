"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTeacherExamFormAction } from "@/app/(dashboard)/teacher/exams/actions";
import type { TeacherExamFormState } from "@/app/(dashboard)/teacher/exams/actions";

const initialTeacherExamFormState: TeacherExamFormState = {
  success: false,
  message: "",
};

interface TeacherExamFormProps {
  assignments: Array<{
    subjectId: string;
    subjectName: string;
    classId: string;
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

export function TeacherExamForm({ assignments, terms }: TeacherExamFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createTeacherExamFormAction,
    initialTeacherExamFormState
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
            <span className="font-medium text-stone-200">Exam Title</span>
            <input
              name="title"
              required
              placeholder="First Continuous Assessment"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-sky-300/50 focus:bg-white/10"
            />
          </label>
          <FieldError messages={state.errors?.title} />
        </div>

        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Exam Type</span>
          <select
            name="type"
            defaultValue="EXAM"
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-sky-300/50"
          >
            <option value="MIDTERM">Midterm</option>
            <option value="CUSTOM_TEST">Custom Test</option>
            <option value="EXAM">Exam</option>
            <option value="CBT">CBT</option>
          </select>
        </label>

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
              {assignments.map((assignment) => (
                <option key={`${assignment.subjectId}-${assignment.classId}`} value={assignment.subjectId}>
                  {assignment.subjectName} • {assignment.className}
                </option>
              ))}
            </select>
          </label>
          <FieldError messages={state.errors?.subjectId} />
        </div>

        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Class</span>
            <select
              name="classId"
              required
              defaultValue=""
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-sky-300/50"
            >
              <option value="" disabled>
                Select class
              </option>
              {assignments.map((assignment) => (
                <option key={`${assignment.classId}-${assignment.subjectId}`} value={assignment.classId}>
                  {assignment.className}
                </option>
              ))}
            </select>
          </label>
          <FieldError messages={state.errors?.classId} />
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
          <span className="font-medium text-stone-200">Duration (minutes)</span>
          <input
            name="duration"
            type="number"
            min={1}
            defaultValue={60}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-300/50 focus:bg-white/10"
          />
        </label>

        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Total Marks</span>
          <input
            name="totalMarks"
            type="number"
            min={1}
            defaultValue={100}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-300/50 focus:bg-white/10"
          />
        </label>

        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Passing Marks</span>
          <input
            name="passingMarks"
            type="number"
            min={0}
            defaultValue={40}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-300/50 focus:bg-white/10"
          />
        </label>

        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Max Violations</span>
          <input
            name="maxViolations"
            type="number"
            min={1}
            defaultValue={3}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-300/50 focus:bg-white/10"
          />
        </label>

        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Start Time</span>
          <input
            name="startTime"
            type="datetime-local"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-300/50 focus:bg-white/10"
          />
        </label>

        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">End Time</span>
          <input
            name="endTime"
            type="datetime-local"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-300/50 focus:bg-white/10"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm text-stone-300">
        <span className="font-medium text-stone-200">Instructions</span>
        <textarea
          name="instructions"
          rows={4}
          placeholder="Add instructions for students before they begin the assessment."
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-sky-300/50 focus:bg-white/10"
        />
      </label>

      <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 md:grid-cols-3">
        <label className="flex items-center gap-3 text-sm text-stone-200">
          <input type="checkbox" name="shuffleQuestions" defaultChecked className="h-4 w-4" />
          Shuffle questions
        </label>
        <label className="flex items-center gap-3 text-sm text-stone-200">
          <input type="checkbox" name="isProctoringEnabled" className="h-4 w-4" />
          Enable proctoring
        </label>
        <label className="flex items-center gap-3 text-sm text-stone-200">
          <input type="checkbox" name="isWebcamRequired" className="h-4 w-4" />
          Require webcam
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
        {pending ? "Creating exam..." : "Create Exam"}
      </button>
    </form>
  );
}
