import { NextRequest, NextResponse } from "next/server";
import { requireAuth, canManageLink } from "@/lib/auth";
import { linkRepository } from "@/repositories/link.repository";
import { prisma } from "@/lib/prisma";
import { successResponse, handleApiError, NotFoundError, ForbiddenError } from "@/lib/errors";
import { z } from "zod";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const link = await linkRepository.findById(params.id);
    if (!link) throw new NotFoundError("Link");
    if (!canManageLink(user, link.userId)) throw new ForbiddenError();

    const history = await prisma.linkHistory.findMany({
      where: { linkId: params.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(successResponse(history));
  } catch (err) {
    const errResp = handleApiError(err);
    return NextResponse.json(errResp, { status: (err as { statusCode?: number }).statusCode ?? 500 });
  }
}

// Rollback to a previous destination
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const link = await linkRepository.findById(params.id);
    if (!link) throw new NotFoundError("Link");
    if (!canManageLink(user, link.userId)) throw new ForbiddenError();

    const body = await request.json();
    const { historyId } = z.object({ historyId: z.string().cuid() }).parse(body);

    const restored = await linkRepository.restoreDestination(params.id, historyId, user.id);
    return NextResponse.json(successResponse(restored));
  } catch (err) {
    const errResp = handleApiError(err);
    return NextResponse.json(errResp, { status: (err as { statusCode?: number }).statusCode ?? 500 });
  }
}
