"use client";

import { useActionState, useEffect, useRef } from "react";
import { createStudentFormAction } from "@/app/(dashboard)/admin/students/actions";
import type {
  StudentFormState,
} from "@/app/(dashboard)/admin/students/actions";

const initialStudentFormState: StudentFormState = {
  success: false,
  message: "",
};

interface StudentCreateFormProps {
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

export function StudentCreateForm({ classes }: StudentCreateFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createStudentFormAction,
    initialStudentFormState
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
          <Input label="First Name" name="firstName" required placeholder="Chidera" />
          <FieldError messages={state.errors?.firstName} />
        </div>
        <div>
          <Input label="Last Name" name="lastName" required placeholder="Ibrahim" />
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
              {classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.name} ({schoolClass.level})
                </option>
              ))}
            </select>
          </label>
          <FieldError messages={state.errors?.classId} />
        </div>
        <Input label="Date of Birth" name="dateOfBirth" type="date" />
        <Input label="Parent Name" name="parentName" placeholder="Guardian / Parent" />
        <div>
          <Input
            label="Parent Email"
            name="parentEmail"
            type="email"
            placeholder="parent@example.com"
          />
          <FieldError messages={state.errors?.parentEmail} />
        </div>
        <Input label="Parent Phone" name="parentPhone" type="tel" placeholder="+234..." />
      </div>

      <label className="grid gap-2 text-sm text-stone-300">
        <span className="font-medium text-stone-200">Address</span>
        <textarea
          name="address"
          rows={3}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-amber-300/50 focus:bg-white/10"
          placeholder="Home address"
        />
      </label>

      <div className="rounded-3xl border border-amber-200/15 bg-amber-300/10 p-4 text-sm text-amber-50">
        New student accounts also use the generated Access ID as the default password on first sign-in.
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
        {pending ? "Creating student..." : "Create Student Account"}
      </button>
    </form>
  );
}
