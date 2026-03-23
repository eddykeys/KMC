"use client";

import { useActionState } from "react";
import { markClassAttendanceFormAction } from "@/app/(dashboard)/teacher/attendance/actions";
import type { AttendanceFormState } from "@/app/(dashboard)/teacher/attendance/actions";

const initialAttendanceFormState: AttendanceFormState = {
  success: false,
  message: "",
};

interface AttendanceMarkFormProps {
  classId: string;
  terms: Array<{
    id: string;
    name: string;
    sessionName: string;
  }>;
  students: Array<{
    id: string;
    fullName: string;
    accessId: string;
  }>;
}

export function AttendanceMarkForm({
  classId,
  terms,
  students,
}: AttendanceMarkFormProps) {
  const boundAction = markClassAttendanceFormAction.bind(null, classId);
  const [state, formAction, pending] = useActionState(
    boundAction,
    initialAttendanceFormState
  );

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Date</span>
          <input
            name="date"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-300/50 focus:bg-white/10"
          />
        </label>

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
      </div>

      <div className="grid gap-3">
        {students.map((student) => (
          <article
            key={student.id}
            className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4 lg:grid-cols-[1.1fr_180px_1fr]"
          >
            <div>
              <p className="font-semibold text-white">{student.fullName}</p>
              <p className="mt-1 text-sm text-stone-400">{student.accessId}</p>
            </div>

            <label className="grid gap-2 text-sm text-stone-300">
              <span className="font-medium text-stone-200">Status</span>
              <select
                name={`status_${student.id}`}
                defaultValue="PRESENT"
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-sky-300/50"
              >
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
                <option value="EXCUSED">Excused</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm text-stone-300">
              <span className="font-medium text-stone-200">Note</span>
              <input
                name={`note_${student.id}`}
                placeholder="Optional note"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-sky-300/50 focus:bg-white/10"
              />
            </label>
          </article>
        ))}
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
        {pending ? "Saving attendance..." : "Save Attendance"}
      </button>
    </form>
  );
}
