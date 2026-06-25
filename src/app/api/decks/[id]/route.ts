import { z } from "zod";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { route, parseBody, HttpError } from "@/lib/http";

async function ownDeck(userId: string, id: string) {
  const deck = await prisma.deck.findUnique({ where: { id } });
  if (!deck || deck.createdById !== userId) throw new HttpError(404, "Deck not found");
  return deck;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    const deck = await ownDeck(userId, id);
    return { deck };
  });
}

const patch = z.object({ title: z.string().max(120).optional(), themeId: z.string().optional(), slides: z.array(z.unknown()).optional() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    await ownDeck(userId, id);
    const b = await parseBody(req, patch);
    const data: Prisma.DeckUpdateInput = {};
    if (b.title !== undefined) data.title = b.title;
    if (b.themeId !== undefined) data.themeId = b.themeId;
    if (b.slides !== undefined) data.slides = b.slides as Prisma.InputJsonValue;
    const deck = await prisma.deck.update({ where: { id }, data });
    return { deck };
  });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    await ownDeck(userId, id);
    await prisma.deck.delete({ where: { id } });
    return { ok: true };
  });
}
