import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseBody, route } from "@/lib/http";
import { hashPassword } from "@/lib/password";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";

export async function POST(req: Request) {
  return route(async () => {
    const body = await parseBody(req, z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(1).max(80), inviteToken: z.string().cuid().optional() }));
    if (await prisma.user.findUnique({ where: { email: body.email } })) return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    const invite = body.inviteToken ? await prisma.workspaceInvite.findUnique({ where: { token: body.inviteToken } }) : null;
    if (invite && (invite.email.toLowerCase() !== body.email.toLowerCase() || invite.expiresAt < new Date() || invite.acceptedAt)) return NextResponse.json({ error: "Invitation is invalid or expired" }, { status: 400 });
    const user = await prisma.user.create({ data: { email: body.email, name: body.name, passwordHash: hashPassword(body.password) } });
    if (invite) await prisma.$transaction([
      prisma.membership.upsert({ where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: user.id } }, update: { role: invite.role }, create: { workspaceId: invite.workspaceId, userId: user.id, role: invite.role } }),
      prisma.workspaceInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
    ]);
    const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } }, { status: 201 });
    res.cookies.set(SESSION_COOKIE, signSession(user.id), sessionCookieOptions);
    return res;
  });
}
