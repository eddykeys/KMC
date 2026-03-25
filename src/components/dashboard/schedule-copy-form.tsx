"use client";

import { useActionState, useEffect, useRef } from "react";
import { copyScheduleDayFormAction } from "@/app/(dashboard)/admin/schedules/actions";
import type { CopyScheduleFormState } from "@/app/(dashboard)/admin/schedules/actions";

const initialCopyScheduleState: CopyScheduleFormState = {
  success: false,
  message: "",
};

const DAYS = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
];

interface ScheduleCopyFormProps {
  classes: Array<{
    id: string;
    name: string;
    level: string;
  }>;
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;

  return <p className="mt-2 text-xs text-rose-300">{messages[0]}</p>;
}

export function ScheduleCopyForm({ classes }: ScheduleCopyFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    copyScheduleDayFormAction,
    initialCopyScheduleState,
  );

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
      <div>
        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Class</span>
          <select
            name="classId"
            required
            defaultValue=""
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-amber-300/50"
          >
            <option value="" disabled>
              Select class
            </option>
            {classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name} ({classItem.level})
              </option>
            ))}
          </select>
        </label>
        <FieldError messages={state.errors?.classId} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Copy from</span>
            <select
              name="sourceDay"
              required
              defaultValue=""
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-amber-300/50"
            >
              <option value="" disabled>
                Select source day
              </option>
              {DAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </label>
          <FieldError messages={state.errors?.sourceDay} />
        </div>

        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Copy to</span>
            <select
              name="targetDay"
              required
              defaultValue=""
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-amber-300/50"
            >
              <option value="" disabled>
                Select target day
              </option>
              {DAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </label>
          <FieldError messages={state.errors?.targetDay} />
        </div>
      </div>

      <div className="rounded-3xl border border-amber-200/15 bg-amber-300/10 p-4 text-sm text-amber-50">
        Copying keeps the same subjects and time slots for the selected class. The target day must
        be empty, and conflicts still get blocked before anything is saved.
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
        {pending ? "Copying day schedule..." : "Copy Day Schedule"}
      </button>
    </form>
  );
}
