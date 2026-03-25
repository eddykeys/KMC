"use client";

import { useActionState, useEffect, useRef } from "react";
import { createScheduleFormAction } from "@/app/(dashboard)/admin/schedules/actions";
import type { ScheduleFormState } from "@/app/(dashboard)/admin/schedules/actions";

const initialScheduleFormState: ScheduleFormState = {
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

interface ScheduleCreateFormProps {
  subjects: Array<{
    id: string;
    name: string;
    className: string;
    teacherLabel: string;
  }>;
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;

  return <p className="mt-2 text-xs text-rose-300">{messages[0]}</p>;
}

export function ScheduleCreateForm({ subjects }: ScheduleCreateFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createScheduleFormAction,
    initialScheduleFormState,
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
          <span className="font-medium text-stone-200">Subject and class</span>
          <select
            name="subjectId"
            required
            defaultValue=""
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-amber-300/50"
          >
            <option value="" disabled>
              Select subject
            </option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name} - {subject.className} {subject.teacherLabel ? `(${subject.teacherLabel})` : ""}
              </option>
            ))}
          </select>
        </label>
        <FieldError messages={state.errors?.subjectId} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Day</span>
            <select
              name="day"
              required
              defaultValue=""
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-amber-300/50"
            >
              <option value="" disabled>
                Select day
              </option>
              {DAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </label>
          <FieldError messages={state.errors?.day} />
        </div>

        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Start time</span>
            <input
              name="startTime"
              type="time"
              required
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-300/50 focus:bg-white/10"
            />
          </label>
          <FieldError messages={state.errors?.startTime} />
        </div>

        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">End time</span>
            <input
              name="endTime"
              type="time"
              required
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-300/50 focus:bg-white/10"
            />
          </label>
          <FieldError messages={state.errors?.endTime} />
        </div>
      </div>

      <div className="rounded-3xl border border-amber-200/15 bg-amber-300/10 p-4 text-sm text-amber-50">
        Timetable entries automatically use the selected subject&apos;s class. Conflicting class or
        teacher periods are blocked before the schedule is saved.
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
        {pending ? "Saving timetable slot..." : "Create Timetable Entry"}
      </button>
    </form>
  );
}
