"use client";

import { useActionState, useEffect, useRef } from "react";
import { createAnnouncementFormAction } from "@/app/(dashboard)/admin/announcements/actions";
import type { AnnouncementFormState } from "@/app/(dashboard)/admin/announcements/actions";

const initialAnnouncementFormState: AnnouncementFormState = {
  success: false,
  message: "",
};

interface AnnouncementCreateFormProps {
  classes: Array<{
    id: string;
    name: string;
  }>;
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;

  return <p className="mt-2 text-xs text-rose-300">{messages[0]}</p>;
}

export function AnnouncementCreateForm({
  classes,
}: AnnouncementCreateFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createAnnouncementFormAction,
    initialAnnouncementFormState
  );

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Title</span>
            <input
              name="title"
              required
              placeholder="Midterm timetable update"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-amber-300/50 focus:bg-white/10"
            />
          </label>
          <FieldError messages={state.errors?.title} />
        </div>

        <div>
          <label className="grid gap-2 text-sm text-stone-300">
            <span className="font-medium text-stone-200">Priority</span>
            <select
              name="priority"
              defaultValue="0"
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-amber-300/50"
            >
              <option value="0">Normal</option>
              <option value="1">Important</option>
              <option value="2">Urgent</option>
            </select>
          </label>
          <FieldError messages={state.errors?.priority} />
        </div>

        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Target Class</span>
          <select
            name="classId"
            defaultValue=""
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-amber-300/50"
          >
            <option value="">School-wide</option>
            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm text-stone-300 md:col-span-2">
          <span className="font-medium text-stone-200">Expires At</span>
          <input
            name="expiresAt"
            type="datetime-local"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-300/50 focus:bg-white/10"
          />
        </label>
      </div>

      <div>
        <label className="grid gap-2 text-sm text-stone-300">
          <span className="font-medium text-stone-200">Announcement Body</span>
          <textarea
            name="content"
            required
            rows={6}
            placeholder="Share the update, instructions, or reminder here."
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-amber-300/50 focus:bg-white/10"
          />
        </label>
        <FieldError messages={state.errors?.content} />
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
        {pending ? "Publishing..." : "Publish Announcement"}
      </button>
    </form>
  );
}
