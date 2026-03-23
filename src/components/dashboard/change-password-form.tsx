"use client";

import { useActionState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { changePasswordFormAction } from "@/app/(auth)/change-password/actions";
import type { ChangePasswordFormState } from "@/app/(auth)/change-password/actions";

const initialChangePasswordState: ChangePasswordFormState = {
  success: false,
  message: "",
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return <p className="mt-2 text-xs text-rose-300">{messages[0]}</p>;
}

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePasswordFormAction,
    initialChangePasswordState
  );

  useEffect(() => {
    if (state.success) {
      void signOut({ callbackUrl: "/login?updated=1" });
    }
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="currentPassword"
          className="block text-sm font-medium text-slate-300 mb-2"
        >
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
          required
        />
        <FieldError messages={state.errors?.currentPassword} />
      </div>

      <div>
        <label
          htmlFor="newPassword"
          className="block text-sm font-medium text-slate-300 mb-2"
        >
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
          required
        />
        <FieldError messages={state.errors?.newPassword} />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-slate-300 mb-2"
        >
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
          required
        />
        <FieldError messages={state.errors?.confirmPassword} />
      </div>

      {state.message ? (
        <div
          className={`p-3 rounded-xl text-sm border ${
            state.success
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
      >
        {pending ? "Updating password..." : "Update Password"}
      </button>
    </form>
  );
}
