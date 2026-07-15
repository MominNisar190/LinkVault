import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { successResponse, handleApiError, NotFoundError } from "@/lib/errors";
import { getClientIp } from "@/lib/rate-limit";

// POST /api/admin/users/:id/approve  → approve pending user
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const ip    = getClientIp(request);

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) throw new NotFoundError("User");

    const updated = await prisma.user.update({
      where: { id: params.id },
      data:  { status: "ACTIVE" },
    });

    await createAuditLog({
      userId:    admin.id,
      action:    "UPDATE",
      resource:  "User",
      resourceId: params.id,
      metadata:  { action: "approve", targetEmail: user.email },
      ipAddress: ip,
    });

    return NextResponse.json(successResponse({ approved: true, user: updated }));
  } catch (err) {
    return NextResponse.json(handleApiError(err), {
      status: (err as { statusCode?: number }).statusCode ?? 500,
    });
  }
}

// DELETE /api/admin/users/:id/approve  → reject / set back to pending
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const ip    = getClientIp(request);

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) throw new NotFoundError("User");

    const updated = await prisma.user.update({
      where: { id: params.id },
      data:  { status: "PENDING" },
    });

    await createAuditLog({
      userId:    admin.id,
      action:    "UPDATE",
      resource:  "User",
      resourceId: params.id,
      metadata:  { action: "revoke-approval", targetEmail: user.email },
      ipAddress: ip,
    });

    return NextResponse.json(successResponse({ revoked: true, user: updated }));
  } catch (err) {
    return NextResponse.json(handleApiError(err), {
      status: (err as { statusCode?: number }).statusCode ?? 500,
    });
  }
}
