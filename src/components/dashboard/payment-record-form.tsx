"use client";

import { useActionState, useEffect, useRef } from "react";
import { recordPaymentFormAction } from "@/app/(dashboard)/admin/fees/actions";
import type { PaymentFormState } from "@/app/(dashboard)/admin/fees/actions";

const initialPaymentFormState: PaymentFormState = {
  success: false,
  message: "",
};

interface PaymentRecordFormProps {
  students: Array<{
    id: string;
    fullName: string;
    accessId: string;
    className: string;
  }>;
  fees: Array<{
    id: string;
    name: string;
    amount: number;
  }>;
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return <p className="mt-2 text-xs text-rose-300">{messages[0]}</p>;
}

export function PaymentRecordForm({ students, fees }: PaymentRecordFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    recordPaymentFormAction,
    initialPaymentFormState
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
            <span className="font-medium text-stone-200">Fee</span>
            <select
              name="feeId"
              required
              defaultValue=""
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-amber-300/50"
            >
              <option value="" disabled>
                Select fee
              </option>
              {fees.map((fee) => (
                <option key={fee.id} value={fee.id}>
                  {fee.name} • NGN {fee.amount.toLocaleString("en-NG")}
                </option>
              ))}
            </select>
          </label>
          <FieldError messages={state.errors?.feeId} />
        </div>

        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Amount paid</span>
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

        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Payment method</span>
          <input
            name="method"
            placeholder="Bank transfer"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-amber-300/50 focus:bg-white/10"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm text-stone-300">
        <span className="font-medium text-stone-200">Reference</span>
        <input
          name="reference"
          placeholder="Receipt number or transfer reference"
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
        {pending ? "Recording payment..." : "Record Payment"}
      </button>
    </form>
  );
}
