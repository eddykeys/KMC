"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTeacherFormAction } from "@/app/(dashboard)/admin/teachers/actions";
import type { TeacherFormState } from "@/app/(dashboard)/admin/teachers/actions";

const initialTeacherFormState: TeacherFormState = {
  success: false,
  message: "",
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;

  return <p className="mt-2 text-xs text-rose-300">{messages[0]}</p>;
}

function Input({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm text-stone-300">
      <span className="font-medium text-stone-200">{label}</span>
      <input
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-amber-300/50 focus:bg-white/10"
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
      />
    </label>
  );
}

export function TeacherCreateForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createTeacherFormAction,
    initialTeacherFormState
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
          <Input label="First Name" name="firstName" required placeholder="Ada" />
          <FieldError messages={state.errors?.firstName} />
        </div>
        <div>
          <Input label="Last Name" name="lastName" required placeholder="Okafor" />
          <FieldError messages={state.errors?.lastName} />
        </div>
        <Input label="Middle Name" name="middleName" placeholder="Optional" />
        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Gender</span>
            <select
              name="gender"
              required
              defaultValue=""
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-amber-300/50"
            >
              <option value="" disabled>
                Select gender
              </option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </label>
          <FieldError messages={state.errors?.gender} />
        </div>
        <div>
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="teacher@school.edu.ng"
          />
          <FieldError messages={state.errors?.email} />
        </div>
        <Input label="Phone" name="phone" type="tel" placeholder="+234..." />
        <Input
          label="Qualification"
          name="qualification"
          placeholder="B.Ed Mathematics"
        />
        <Input
          label="Specialization"
          name="specialization"
          placeholder="STEM / English / Arts"
        />
        <Input label="Date of Birth" name="dateOfBirth" type="date" />
      </div>

      <label className="grid gap-2 text-sm text-stone-300">
        <span className="font-medium text-stone-200">Address</span>
        <textarea
          name="address"
          rows={3}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-amber-300/50 focus:bg-white/10"
          placeholder="Residential address"
        />
      </label>

      <div className="rounded-3xl border border-amber-200/15 bg-amber-300/10 p-4 text-sm text-amber-50">
        New teacher accounts use their generated Access ID as the default password on first sign-in.
      </div>

      {state.message ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            state.success
              ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
              : "border-rose-300/20 bg-rose-400/10 text-rose-100"
          }`}
        >
          <p>{state.message}</p>
          {state.accessId ? (
            <p className="mt-1 font-semibold">Generated Access ID: {state.accessId}</p>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-2xl bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating teacher..." : "Create Teacher Account"}
      </button>
    </form>
  );
}
