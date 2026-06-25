import { prisma } from "@/lib/db";
import { getOptionalUserId } from "@/lib/auth";
import { InviteAccept } from "@/components/InviteAccept";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = { OWNER: "所有者", ADMIN: "管理员", MEMBER: "成员", ADVISOR: "顾问", VIEWER: "只读" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await prisma.workspaceInvite.findUnique({ where: { token }, include: { workspace: { select: { name: true } } } });
  const valid = Boolean(invite && invite.expiresAt >= new Date());
  const userId = await getOptionalUserId();
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
    <div className="card text-center">
      <p className="text-sm text-emerald-300">承策 · 工作区邀请</p>
      {valid && invite ? <>
        <h1 className="mt-2 text-2xl font-semibold">加入「{invite.workspace.name}」</h1>
        <p className="mt-2 text-sm text-slate-400">你被邀请以 {ROLE_LABEL[invite.role] ?? invite.role} 身份加入该工作区。</p>
        <div className="mt-5"><InviteAccept token={token} workspaceName={invite.workspace.name} loggedIn={Boolean(userId)} /></div>
      </> : <>
        <h1 className="mt-2 text-2xl font-semibold">邀请无效或已过期</h1>
        <p className="mt-2 text-sm text-slate-400">请向邀请人索取新的邀请链接。</p>
        <a className="button-secondary mt-5 inline-block" href="/login">前往登录</a>
      </>}
    </div>
  </main>;
}
