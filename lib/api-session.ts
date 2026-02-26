import { auth, type SessionUser } from "@/lib/auth";

export async function getApiUser() {
  const session = await auth();
  return (session?.user ?? null) as SessionUser | null;
}
