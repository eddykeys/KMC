"use client";

import { useActionState } from "react";
import { updateTeacherFormAction } from "@/app/(dashboard)/admin/teachers/[teacherId]/actions";
import type { EditTeacherFormState } from "@/app/(dashboard)/admin/teachers/[teacherId]/actions";

const initialEditTeacherState: EditTeacherFormState = {
  success: false,
  message: "",
};

interface TeacherEditFormProps {
  teacherId: string;
  initialValues: {
    firstName: string;
    lastName: string;
    middleName: string;
    email: string;
    gender: string;
    phone: string;
    qualification: string;
    specialization: string;
    dateOfBirth: string;
    address: string;
  };
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return <p className="mt-2 text-xs text-rose-300">{messages[0]}</p>;
}

export function TeacherEditForm({
  teacherId,
  initialValues,
}: TeacherEditFormProps) {
  const boundAction = updateTeacherFormAction.bind(null, teacherId);
  const [state, formAction, pending] = useActionState(boundAction, initialEditTeacherState);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">First Name</span>
            <input
              name="firstName"
              defaultValue={initialValues.firstName}
              required
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-300/50 focus:bg-white/10"
            />
          </label>
          <FieldError messages={state.errors?.firstName} />
        </div>
        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Last Name</span>
            <input
              name="lastName"
              defaultValue={initialValues.lastName}
              required
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-300/50 focus:bg-white/10"
            />
          </label>
          <FieldError messages={state.errors?.lastName} />
        </div>
        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Middle Name</span>
          <input
            name="middleName"
            defaultValue={initialValues.middleName}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-300/50 focus:bg-white/10"
          />
        </label>
        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Gender</span>
            <select
              name="gender"
              defaultValue={initialValues.gender}
              required
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-amber-300/50"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </label>
          <FieldError messages={state.errors?.gender} />
        </div>
        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Email</span>
            <input
              name="email"
              type="email"
              defaultValue={initialValues.email}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-300/50 focus:bg-white/10"
            />
          </label>
          <FieldError messages={state.errors?.email} />
        </div>
        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Phone</span>
          <input
            name="phone"
            defaultValue={initialValues.phone}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-300/50 focus:bg-white/10"
          />
        </label>
        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Qualification</span>
          <input
            name="qualification"
            defaultValue={initialValues.qualification}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-300/50 focus:bg-white/10"
          />
        </label>
        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Specialization</span>
          <input
            name="specialization"
            defaultValue={initialValues.specialization}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-300/50 focus:bg-white/10"
          />
        </label>
        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Date of Birth</span>
          <input
            name="dateOfBirth"
            type="date"
            defaultValue={initialValues.dateOfBirth}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-300/50 focus:bg-white/10"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm text-stone-300">
        <span className="font-medium text-stone-200">Address</span>
        <textarea
          name="address"
          rows={4}
          defaultValue={initialValues.address}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-300/50 focus:bg-white/10"
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
        {pending ? "Saving changes..." : "Save Teacher Changes"}
      </button>
    </form>
  );
}
