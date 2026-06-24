import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { HttpError } from "@/lib/http";

export async function getOptionalUserId(): Promise<string | null> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

/** Local development has an explicit, auto-created user; production requires a signed session. */
export async function getUserId(): Promise<string> {
  const sessionUser = await getOptionalUserId();
  if (sessionUser) return sessionUser;
  const id = process.env.DEV_USER_ID;
  if (!id) throw new HttpError(401, "Please sign in");
  await prisma.user.upsert({ where: { id }, update: {}, create: { id, email: `${id}@chengce.local`, name: "Local owner" } });
  return id;
}
