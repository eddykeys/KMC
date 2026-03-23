import { LoginForm } from "@/components/dashboard/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const params = await searchParams;
  return (
    <LoginForm passwordUpdated={params.updated === "1"} />
  );
}
