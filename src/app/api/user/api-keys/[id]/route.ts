import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { successResponse, handleApiError, NotFoundError, ForbiddenError } from "@/lib/errors";
import { getClientIp } from "@/lib/rate-limit";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const ip = getClientIp(request);
    const key = await prisma.apiKey.findUnique({ where: { id } });
    if (!key) throw new NotFoundError("API Key");
    if (key.userId !== user.id) throw new ForbiddenError();
    await prisma.apiKey.update({ where: { id }, data: { isActive: false } });
    await createAuditLog({ userId: user.id, action: "API_KEY_REVOKE", resource: "ApiKey", resourceId: id, ipAddress: ip });
    return NextResponse.json(successResponse({ revoked: true }));
  } catch (err) {
    return NextResponse.json(handleApiError(err), { status: (err as any).statusCode ?? 500 });
  }
}
