import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, handleApiError, NotFoundError } from "@/lib/errors";
import { getClientIp } from "@/lib/rate-limit";

// POST /api/admin/users/:id/approve  → approve pending user
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const ip    = getClientIp(request);
    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError("User");

    // Update status and write audit log in one transaction
    const [updated] = await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data:  { status: "ACTIVE" },
      }),
      prisma.auditLog.create({
        data: {
          userId:     admin.id,
          action:     "UPDATE",
          resource:   "User",
          resourceId: id,
          metadata:   { action: "approve", targetEmail: user.email } as any,
          ipAddress:  ip,
        },
      }),
    ]);

    console.log(`[APPROVE] ${user.email} → ACTIVE by ${admin.email}`);
    return NextResponse.json(successResponse({ approved: true, user: updated }));
  } catch (err) {
    console.error("[APPROVE ERROR]", err);
    return NextResponse.json(handleApiError(err), {
      status: (err as { statusCode?: number }).statusCode ?? 500,
    });
  }
}

// DELETE /api/admin/users/:id/approve  → revoke approval back to pending
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const ip    = getClientIp(request);
    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError("User");

    const [updated] = await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data:  { status: "PENDING" },
      }),
      prisma.auditLog.create({
        data: {
          userId:     admin.id,
          action:     "UPDATE",
          resource:   "User",
          resourceId: id,
          metadata:   { action: "revoke-approval", targetEmail: user.email } as any,
          ipAddress:  ip,
        },
      }),
    ]);

    return NextResponse.json(successResponse({ revoked: true, user: updated }));
  } catch (err) {
    console.error("[REVOKE APPROVE ERROR]", err);
    return NextResponse.json(handleApiError(err), {
      status: (err as { statusCode?: number }).statusCode ?? 500,
    });
  }
}
