import { NextRequest, NextResponse } from "next/server";
import { requireAuth, canManageLink } from "@/lib/auth";
import { linkRepository } from "@/repositories/link.repository";
import { createAuditLog } from "@/lib/audit";
import { updateLinkSchema } from "@/lib/validations";
import { successResponse, handleApiError, NotFoundError, ForbiddenError } from "@/lib/errors";
import { apiRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const link = await linkRepository.findByIdWithRelations(id);
    if (!link) throw new NotFoundError("Link");
    if (!canManageLink(user, link.userId)) throw new ForbiddenError();
    return NextResponse.json(successResponse(link));
  } catch (err) {
    return NextResponse.json(handleApiError(err), { status: (err as any).statusCode ?? 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const ip   = getClientIp(request);
    apiRateLimit(ip);

    const link = await linkRepository.findById(id);
    if (!link) throw new NotFoundError("Link");
    if (!canManageLink(user, link.userId)) throw new ForbiddenError();

    const body    = await request.json();
    const input   = updateLinkSchema.parse({ ...body, id });
    const updated = await linkRepository.update(id, user.id, input);

    await createAuditLog({ userId: user.id, action: "UPDATE", resource: "DynamicLink", resourceId: id, ipAddress: ip });
    return NextResponse.json(successResponse(updated));
  } catch (err) {
    return NextResponse.json(handleApiError(err), { status: (err as any).statusCode ?? 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const ip   = getClientIp(request);

    const link = await linkRepository.findById(id);
    if (!link) throw new NotFoundError("Link");
    if (!canManageLink(user, link.userId)) throw new ForbiddenError();

    await linkRepository.delete(id);
    await createAuditLog({ userId: user.id, action: "DELETE", resource: "DynamicLink", resourceId: id, ipAddress: ip });
    return NextResponse.json(successResponse({ deleted: true }));
  } catch (err) {
    return NextResponse.json(handleApiError(err), { status: (err as any).statusCode ?? 500 });
  }
}
