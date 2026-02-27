"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { z } from "zod";
import { toast } from "@/lib/toast";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    const payload = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Form tidak valid");
      return;
    }

    setError("");

    startTransition(async () => {
      const response = await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
        callbackUrl: "/app",
      });

      if (response?.error) {
        setError("Email atau password salah");
        toast.error("Login gagal. Periksa email dan password.");
        return;
      }

      let hasRedirected = false;
      const redirectToDashboard = () => {
        if (hasRedirected) return;
        hasRedirected = true;
        window.location.assign("/app");
      };

      toast.success("Login berhasil. Selamat datang di Solvix ERP.", {
        description: "Anda akan diarahkan ke dashboard.",
        action: {
          label: "Buka Dashboard",
          onClick: () => {
            redirectToDashboard();
          },
        },
        duration: 1200,
      });

      window.setTimeout(() => {
        redirectToDashboard();
      }, 700);

      router.prefetch("/app");
    });
  }

  return (
    <Card className="w-full max-w-md p-6 md:p-7">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">Login Solvix ERP</h1>
        <p className="mt-1 text-sm text-muted-foreground">Masuk untuk mengakses dashboard.</p>
      </div>
      <form action={handleSubmit} className="space-y-4">
        <div className="mt-4 space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="mt-4 space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowPassword((state) => !state)}
              aria-label="Toggle password"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <Button className="w-full" disabled={isPending}>
          <LogIn className="h-4 w-4" /> {isPending ? "Memproses..." : "Masuk"}
        </Button>
      </form>
      <div className="mt-4 rounded-2xl border border-border/70 bg-background/40 p-3 text-xs text-muted-foreground">
        Demo akun: `admin@solvix.id` / `manager@solvix.id` / `staff@solvix.id` password: `solvix123`
      </div>
    </Card>
  );
}
