import { NextRequest, NextResponse } from "next/server";
import { requireAuth, canManageLink } from "@/lib/auth";
import { linkRepository } from "@/repositories/link.repository";
import { getLinkAnalyticsSummary } from "@/lib/analytics";
import { successResponse, handleApiError, NotFoundError, ForbiddenError } from "@/lib/errors";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const link = await linkRepository.findById(params.id);
    if (!link) throw new NotFoundError("Link");
    if (!canManageLink(user, link.userId)) throw new ForbiddenError();

    const analytics = await getLinkAnalyticsSummary(params.id, user.id);
    return NextResponse.json(successResponse(analytics));
  } catch (err) {
    const errResp = handleApiError(err);
    return NextResponse.json(errResp, { status: (err as { statusCode?: number }).statusCode ?? 500 });
  }
}
