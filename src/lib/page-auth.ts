// Page authentication is intentionally separate from API authentication.
// APIs return JSON 401 responses; server-rendered pages must redirect instead
// of allowing an auth exception to become a Next.js application-error page.

import { redirect } from "next/navigation";
import { getOptionalUserId } from "@/lib/auth";

export async function requirePageUser(nextPath: string): Promise<string> {
  const userId = await getOptionalUserId();
  if (userId) return userId;
  redirect(`/login?next=${encodeURIComponent(nextPath)}`);
}
