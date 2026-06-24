import type { MembershipRole } from "@/generated/prisma";

/** Workspace role hierarchy. Higher rank = more authority. Pure + prisma-free so it is unit-testable. */
export const ROLE_RANK: Record<MembershipRole, number> = {
  VIEWER: 0,
  MEMBER: 1,
  ADVISOR: 2,
  ADMIN: 3,
  OWNER: 4,
};

export function roleAtLeast(role: MembershipRole, minimum: MembershipRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}
