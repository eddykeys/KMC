import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/dashboard/change-password-form";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";

export default async function ChangePasswordPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as SessionUser;

  if (!user.mustChangePassword) {
    redirect("/");
  }

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4">
            <span className="text-2xl font-black text-white">KMC</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Change Password</h1>
          <p className="text-sm text-slate-400 mt-1">
            Your account is still using the default password. Set a new one to continue.
          </p>
        </div>

        <ChangePasswordForm />
      </div>
    </div>
  );
}
