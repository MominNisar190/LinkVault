import { NextRequest, NextResponse } from "next/server";
import { requireAuth, canManageLink } from "@/lib/auth";
import { linkRepository } from "@/repositories/link.repository";
import { successResponse, handleApiError, NotFoundError, ForbiddenError } from "@/lib/errors";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const link = await linkRepository.findById(id);
    if (!link) throw new NotFoundError("Link");
    if (!canManageLink(user, link.userId)) throw new ForbiddenError();
    const duplicate = await linkRepository.duplicate(id, user.id);
    return NextResponse.json(successResponse(duplicate), { status: 201 });
  } catch (err) {
    return NextResponse.json(handleApiError(err), { status: (err as any).statusCode ?? 500 });
  }
}
