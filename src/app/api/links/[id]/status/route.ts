import { NextRequest, NextResponse } from "next/server";
import { requireAuth, canManageLink } from "@/lib/auth";
import { linkRepository } from "@/repositories/link.repository";
import { z } from "zod";
import { successResponse, handleApiError, NotFoundError, ForbiddenError } from "@/lib/errors";
import { createAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

const statusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const ip = getClientIp(request);
    const link = await linkRepository.findById(params.id);
    if (!link) throw new NotFoundError("Link");
    if (!canManageLink(user, link.userId)) throw new ForbiddenError();

    const body = await request.json();
    const { status } = statusSchema.parse(body);
    const updated = await linkRepository.updateStatus(params.id, status);

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      resource: "DynamicLink",
      resourceId: params.id,
      metadata: { status },
      ipAddress: ip,
    });

    return NextResponse.json(successResponse(updated));
  } catch (err) {
    return NextResponse.json(handleApiError(err), {
      status: (err as { statusCode?: number }).statusCode ?? 500,
    });
  }
}
