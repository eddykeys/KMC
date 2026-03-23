import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as { role: string; mustChangePassword?: boolean };

  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  // Redirect based on role
  switch (user.role) {
    case "ADMIN":
      redirect("/admin");
      break;
    case "TEACHER":
      redirect("/teacher");
      break;
    case "STUDENT":
      redirect("/student");
      break;
    default:
      redirect("/login");
  }
}
