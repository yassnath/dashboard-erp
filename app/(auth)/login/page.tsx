import Image from "next/image";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/layout/login-form";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  let session: Awaited<ReturnType<typeof auth>> | null = null;
  try {
    session = await auth();
  } catch (error) {
    console.error("[LoginPage] Failed to resolve session:", error);
  }

  if (session) {
    redirect("/app");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-5 flex items-center justify-center gap-3">
          <Image src="/logo.png" alt="Solvix ERP" width={40} height={40} className="rounded-xl" />
          <div>
            <p className="font-orbitron text-sm">SOLVIX ERP</p>
            <p className="text-xs text-muted-foreground">Dashboard</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
