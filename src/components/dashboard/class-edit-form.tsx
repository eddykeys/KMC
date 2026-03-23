"use client";

import { useActionState } from "react";
import { updateClassFormAction } from "@/app/(dashboard)/admin/classes/actions";
import type { ClassFormState } from "@/app/(dashboard)/admin/classes/actions";

const initialClassEditState: ClassFormState = {
  success: false,
  message: "",
};

interface ClassEditFormProps {
  classId: string;
  teachers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    accessId: string;
  }>;
  initialValues: {
    name: string;
    level: string;
    classTeacherId: string;
  };
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return <p className="mt-2 text-xs text-rose-300">{messages[0]}</p>;
}

export function ClassEditForm({
  classId,
  teachers,
  initialValues,
}: ClassEditFormProps) {
  const boundAction = updateClassFormAction.bind(null, classId);
  const [state, formAction, pending] = useActionState(boundAction, initialClassEditState);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Class Name</span>
            <input
              name="name"
              defaultValue={initialValues.name}
              required
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-300/50 focus:bg-white/10"
            />
          </label>
          <FieldError messages={state.errors?.name} />
        </div>

        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Level</span>
            <select
              name="level"
              defaultValue={initialValues.level}
              required
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-amber-300/50"
            >
              <option value="JSS1">JSS1</option>
              <option value="JSS2">JSS2</option>
              <option value="JSS3">JSS3</option>
              <option value="SSS1">SSS1</option>
              <option value="SSS2">SSS2</option>
              <option value="SSS3">SSS3</option>
            </select>
          </label>
          <FieldError messages={state.errors?.level} />
        </div>
      </div>

      <div>
        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Class Teacher</span>
          <select
            name="classTeacherId"
            defaultValue={initialValues.classTeacherId}
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-amber-300/50"
          >
            <option value="">No class teacher</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.firstName} {teacher.lastName} ({teacher.accessId})
              </option>
            ))}
          </select>
        </label>
        <FieldError messages={state.errors?.classTeacherId} />
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
        className="inline-flex items-center justify-center rounded-2xl bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving changes..." : "Save Class Changes"}
      </button>
    </form>
  );
}
