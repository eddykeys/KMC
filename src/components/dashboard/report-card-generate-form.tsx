"use client";

import { useActionState, useEffect, useRef } from "react";
import { generateReportCardFormAction } from "@/app/(dashboard)/admin/report-cards/actions";
import type { ReportCardFormState } from "@/app/(dashboard)/admin/report-cards/actions";

const initialReportCardFormState: ReportCardFormState = {
  success: false,
  message: "",
};

interface ReportCardGenerateFormProps {
  students: Array<{
    id: string;
    fullName: string;
    accessId: string;
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

export function ReportCardGenerateForm({
  students,
  terms,
}: ReportCardGenerateFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    generateReportCardFormAction,
    initialReportCardFormState
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
            <span className="font-medium text-stone-200">Student</span>
            <select
              name="studentId"
              required
              defaultValue=""
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-amber-300/50"
            >
              <option value="" disabled>
                Select student
              </option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName} • {student.className} • {student.accessId}
                </option>
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
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-amber-300/50"
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

      <label className="grid gap-2 text-sm text-stone-300">
        <span className="font-medium text-stone-200">Class teacher comment</span>
        <textarea
          name="classTeacherComment"
          rows={3}
          placeholder="Summarize classroom performance, conduct, and next-step support."
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-amber-300/50 focus:bg-white/10"
        />
      </label>

      <label className="grid gap-2 text-sm text-stone-300">
        <span className="font-medium text-stone-200">Principal comment</span>
        <textarea
          name="principalComment"
          rows={3}
          placeholder="Add principal approval notes or recognition."
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-amber-300/50 focus:bg-white/10"
        />
      </label>

      <label className="flex items-center gap-3 text-sm text-stone-200">
        <input type="checkbox" name="isPublished" defaultChecked className="h-4 w-4" />
        Publish immediately to the student dashboard
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
        className="inline-flex items-center justify-center rounded-2xl bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Generating report card..." : "Generate Report Card"}
      </button>
    </form>
  );
}
