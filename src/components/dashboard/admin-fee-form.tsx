"use client";

import { useActionState, useEffect, useRef } from "react";
import { createFeeFormAction } from "@/app/(dashboard)/admin/fees/actions";
import type { FeeFormState } from "@/app/(dashboard)/admin/fees/actions";

const initialFeeFormState: FeeFormState = {
  success: false,
  message: "",
};

interface AdminFeeFormProps {
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

export function AdminFeeForm({ terms }: AdminFeeFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createFeeFormAction, initialFeeFormState);

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
            <span className="font-medium text-stone-200">Fee name</span>
            <input
              name="name"
              required
              placeholder="Third Term School Fees"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-amber-300/50 focus:bg-white/10"
            />
          </label>
          <FieldError messages={state.errors?.name} />
        </div>

        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Amount (NGN)</span>
            <input
              name="amount"
              type="number"
              min={0}
              step="0.01"
              required
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-300/50 focus:bg-white/10"
            />
          </label>
          <FieldError messages={state.errors?.amount} />
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

        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Target level</span>
            <select
              name="level"
              defaultValue=""
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-amber-300/50"
            >
              <option value="">All levels</option>
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

        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Due date</span>
          <input
            name="dueDate"
            type="date"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-300/50 focus:bg-white/10"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm text-stone-300">
        <span className="font-medium text-stone-200">Description</span>
        <textarea
          name="description"
          rows={3}
          placeholder="Describe what this fee covers and any instructions for families."
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-amber-300/50 focus:bg-white/10"
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
        className="inline-flex items-center justify-center rounded-2xl bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating fee..." : "Create Fee"}
      </button>
    </form>
  );
}
