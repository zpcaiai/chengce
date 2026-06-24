import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseBody, route } from "@/lib/http";
import { verifyPassword } from "@/lib/password";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";

export async function POST(req: Request) {
  return route(async () => {
    const { email, password } = await parseBody(req, z.object({ email: z.string().email(), password: z.string() }));
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.passwordHash)) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
    res.cookies.set(SESSION_COOKIE, signSession(user.id), sessionCookieOptions);
    return res;
  });
}
