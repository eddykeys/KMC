"use client";

import { useActionState, useEffect, useRef } from "react";
import { createWeeklyReportFormAction } from "@/app/(dashboard)/teacher/weekly-reports/actions";
import type { WeeklyReportFormState } from "@/app/(dashboard)/teacher/weekly-reports/actions";

const initialWeeklyReportState: WeeklyReportFormState = {
  success: false,
  message: "",
};

interface WeeklyReportFormProps {
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

export function WeeklyReportForm({ terms }: WeeklyReportFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createWeeklyReportFormAction,
    initialWeeklyReportState
  );

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Week start</span>
            <input
              name="weekStart"
              type="date"
              required
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-300/50 focus:bg-white/10"
            />
          </label>
          <FieldError messages={state.errors?.weekStart} />
        </div>

        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Week end</span>
            <input
              name="weekEnd"
              type="date"
              required
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-300/50 focus:bg-white/10"
            />
          </label>
          <FieldError messages={state.errors?.weekEnd} />
        </div>

        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Term</span>
            <select
              name="termId"
              required
              defaultValue={terms[0]?.id ?? ""}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-sky-300/50"
            >
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

      <label className="grid gap-2 text-sm text-stone-300">
        <span className="font-medium text-stone-200">Weekly summary</span>
        <textarea
          name="summary"
          rows={5}
          required
          placeholder="Summarize topics covered, learner participation, and notable classroom outcomes."
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-sky-300/50 focus:bg-white/10"
        />
      </label>
      <FieldError messages={state.errors?.summary} />

      <label className="grid gap-2 text-sm text-stone-300">
        <span className="font-medium text-stone-200">Challenges</span>
        <textarea
          name="challenges"
          rows={4}
          placeholder="Note classroom, curriculum, or learner support challenges from the week."
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-sky-300/50 focus:bg-white/10"
        />
      </label>

      <label className="grid gap-2 text-sm text-stone-300">
        <span className="font-medium text-stone-200">Next week plans</span>
        <textarea
          name="plans"
          rows={4}
          placeholder="Outline instructional plans, interventions, or targets for the coming week."
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
        {pending ? "Submitting report..." : "Submit Weekly Report"}
      </button>
    </form>
  );
}
