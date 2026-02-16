import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function HomePage() {
  const authenticated = await isAuthenticated();
  if (authenticated) {
    redirect("/dashboard");
  }
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <LoginForm />
    </main>
  );
}
