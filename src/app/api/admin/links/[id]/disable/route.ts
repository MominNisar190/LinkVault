import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { linkRepository } from "@/repositories/link.repository";
import { createAuditLog } from "@/lib/audit";
import { successResponse, handleApiError, NotFoundError } from "@/lib/errors";
import { getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = await requireAdmin();
    const ip = getClientIp(request);
    const link = await linkRepository.findById(id);
    if (!link) throw new NotFoundError("Link");
    const updated = await linkRepository.updateStatus(id, "INACTIVE");
    await createAuditLog({ userId: admin.id, action: "UPDATE", resource: "DynamicLink", resourceId: id, metadata: { action: "admin-disable" }, ipAddress: ip });
    return NextResponse.json(successResponse(updated));
  } catch (err) {
    return NextResponse.json(handleApiError(err), { status: (err as any).statusCode ?? 500 });
  }
}
