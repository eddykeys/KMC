"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";
import { upsertTeacherResultFormAction } from "@/app/(dashboard)/teacher/results/actions";
import type { TeacherResultFormState } from "@/app/(dashboard)/teacher/results/actions";

const initialTeacherResultFormState: TeacherResultFormState = {
  success: false,
  message: "",
};

interface TeacherResultFormProps {
  assignments: Array<{
    subjectId: string;
    subjectName: string;
    classId: string;
    className: string;
    level: string;
  }>;
  students: Array<{
    id: string;
    fullName: string;
    accessId: string;
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

export function TeacherResultForm({
  assignments,
  students,
  terms,
}: TeacherResultFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    upsertTeacherResultFormAction,
    initialTeacherResultFormState
  );

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  const studentsByClass = useMemo(() => {
    return students.reduce<Record<string, TeacherResultFormProps["students"]>>((acc, student) => {
      acc[student.classId] ??= [];
      acc[student.classId].push(student);
      return acc;
    }, {});
  }, [students]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
      <div className="rounded-3xl border border-amber-300/15 bg-amber-300/5 p-4 text-sm text-amber-100/80">
        Enter weighted score components so the total reflects the final score out of 100.
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Subject and class</span>
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
                  {assignment.subjectName} • {assignment.className} ({assignment.level})
                </option>
              ))}
            </select>
          </label>
          <FieldError messages={state.errors?.subjectId} />
        </div>

        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Student</span>
            <select
              name="studentId"
              required
              defaultValue=""
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-sky-300/50"
            >
              <option value="" disabled>
                Select student
              </option>
              {Object.entries(studentsByClass).map(([classId, classStudents]) => (
                <optgroup key={classId} label={classStudents[0]?.className ?? "Class"}>
                  {classStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.fullName} • {student.accessId}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <FieldError messages={state.errors?.studentId} />
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
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">First CA</span>
          <input
            name="firstCA"
            type="number"
            min={0}
            max={100}
            step="0.01"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-300/50 focus:bg-white/10"
          />
        </label>

        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Second CA</span>
          <input
            name="secondCA"
            type="number"
            min={0}
            max={100}
            step="0.01"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-300/50 focus:bg-white/10"
          />
        </label>

        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Midterm test</span>
          <input
            name="midTermTest"
            type="number"
            min={0}
            max={100}
            step="0.01"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-300/50 focus:bg-white/10"
          />
        </label>

        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Assignment</span>
          <input
            name="assignment"
            type="number"
            min={0}
            max={100}
            step="0.01"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-300/50 focus:bg-white/10"
          />
        </label>

        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Project</span>
          <input
            name="project"
            type="number"
            min={0}
            max={100}
            step="0.01"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-300/50 focus:bg-white/10"
          />
        </label>

        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Exam score</span>
          <input
            name="examScore"
            type="number"
            min={0}
            max={100}
            step="0.01"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-300/50 focus:bg-white/10"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm text-stone-300">
        <span className="font-medium text-stone-200">Teacher comment</span>
        <textarea
          name="teacherComment"
          rows={4}
          placeholder="Share performance notes, improvement points, or encouragement."
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
        {pending ? "Saving result..." : "Save Result"}
      </button>
    </form>
  );
}
