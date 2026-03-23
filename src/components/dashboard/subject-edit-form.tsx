"use client";

import { useActionState } from "react";
import { updateSubjectFormAction } from "@/app/(dashboard)/admin/subjects/actions";
import type { SubjectFormState } from "@/app/(dashboard)/admin/subjects/actions";

const initialSubjectEditState: SubjectFormState = {
  success: false,
  message: "",
};

interface SubjectEditFormProps {
  subjectId: string;
  classes: Array<{
    id: string;
    name: string;
    level: string;
  }>;
  initialValues: {
    name: string;
    code: string;
    classId: string;
  };
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return <p className="mt-2 text-xs text-rose-300">{messages[0]}</p>;
}

export function SubjectEditForm({
  subjectId,
  classes,
  initialValues,
}: SubjectEditFormProps) {
  const boundAction = updateSubjectFormAction.bind(null, subjectId);
  const [state, formAction, pending] = useActionState(boundAction, initialSubjectEditState);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Subject Name</span>
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
            <span className="font-medium text-stone-200">Code</span>
            <input
              name="code"
              defaultValue={initialValues.code}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-300/50 focus:bg-white/10"
            />
          </label>
          <FieldError messages={state.errors?.code} />
        </div>
      </div>

      <div>
        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Class</span>
          <select
            name="classId"
            defaultValue={initialValues.classId}
            required
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-amber-300/50"
          >
            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.name} ({schoolClass.level})
              </option>
            ))}
          </select>
        </label>
        <FieldError messages={state.errors?.classId} />
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
        {pending ? "Saving changes..." : "Save Subject Changes"}
      </button>
    </form>
  );
}
