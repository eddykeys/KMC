"use client";

import { useActionState, useEffect, useRef } from "react";
import { createClassFormAction } from "@/app/(dashboard)/admin/classes/actions";
import type { ClassFormState } from "@/app/(dashboard)/admin/classes/actions";

const initialClassFormState: ClassFormState = {
  success: false,
  message: "",
};

interface ClassCreateFormProps {
  teachers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    accessId: string;
  }>;
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;

  return <p className="mt-2 text-xs text-rose-300">{messages[0]}</p>;
}

export function ClassCreateForm({ teachers }: ClassCreateFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createClassFormAction,
    initialClassFormState
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
            <span className="font-medium text-stone-200">Class Name</span>
            <input
              name="name"
              required
              placeholder="JSS 1A"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-amber-300/50 focus:bg-white/10"
            />
          </label>
          <FieldError messages={state.errors?.name} />
        </div>

        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Level</span>
            <select
              name="level"
              required
              defaultValue=""
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-amber-300/50"
            >
              <option value="" disabled>
                Select level
              </option>
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
            defaultValue=""
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-amber-300/50"
          >
            <option value="">Assign later</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.firstName} {teacher.lastName} ({teacher.accessId})
              </option>
            ))}
          </select>
        </label>
        <FieldError messages={state.errors?.classTeacherId} />
      </div>

      <div className="rounded-3xl border border-amber-200/15 bg-amber-300/10 p-4 text-sm text-amber-50">
        Only teachers without an existing class-teacher assignment are shown here to avoid ownership conflicts.
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
        {pending ? "Creating class..." : "Create Class"}
      </button>
    </form>
  );
}
