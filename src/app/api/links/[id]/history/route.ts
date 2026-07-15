import { NextRequest, NextResponse } from "next/server";
import { requireAuth, canManageLink } from "@/lib/auth";
import { linkRepository } from "@/repositories/link.repository";
import { prisma } from "@/lib/prisma";
import { successResponse, handleApiError, NotFoundError, ForbiddenError } from "@/lib/errors";
import { z } from "zod";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const link = await linkRepository.findById(id);
    if (!link) throw new NotFoundError("Link");
    if (!canManageLink(user, link.userId)) throw new ForbiddenError();
    const history = await prisma.linkHistory.findMany({ where: { linkId: id }, orderBy: { createdAt: "desc" } });
    return NextResponse.json(successResponse(history));
  } catch (err) {
    return NextResponse.json(handleApiError(err), { status: (err as any).statusCode ?? 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const link = await linkRepository.findById(id);
    if (!link) throw new NotFoundError("Link");
    if (!canManageLink(user, link.userId)) throw new ForbiddenError();
    const body = await request.json();
    const { historyId } = z.object({ historyId: z.string().cuid() }).parse(body);
    const restored = await linkRepository.restoreDestination(id, historyId, user.id);
    return NextResponse.json(successResponse(restored));
  } catch (err) {
    return NextResponse.json(handleApiError(err), { status: (err as any).statusCode ?? 500 });
  }
}
