import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";
import { successResponse, handleApiError, NotFoundError } from "@/lib/errors";
import { getClientIp } from "@/lib/rate-limit";

const banSchema = z.object({ reason: z.string().min(1).max(500) });

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const ip    = getClientIp(request);
    const body  = await request.json();
    const { reason } = banSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) throw new NotFoundError("User");

    const updated = await prisma.user.update({
      where: { id: params.id },
      data:  { isBanned: true, banReason: reason, status: "SUSPENDED" },
    });

    await createAuditLog({
      userId: admin.id, action: "UPDATE", resource: "User",
      resourceId: params.id,
      metadata: { action: "ban", reason, targetEmail: user.email },
      ipAddress: ip,
    });

    return NextResponse.json(successResponse(updated));
  } catch (err) {
    return NextResponse.json(handleApiError(err), {
      status: (err as { statusCode?: number }).statusCode ?? 500,
    });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const ip    = getClientIp(request);

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) throw new NotFoundError("User");

    const updated = await prisma.user.update({
      where: { id: params.id },
      data:  { isBanned: false, banReason: null, status: "ACTIVE" },
    });

    await createAuditLog({
      userId: admin.id, action: "UPDATE", resource: "User",
      resourceId: params.id,
      metadata: { action: "unban", targetEmail: user.email },
      ipAddress: ip,
    });

    return NextResponse.json(successResponse(updated));
  } catch (err) {
    return NextResponse.json(handleApiError(err), {
      status: (err as { statusCode?: number }).statusCode ?? 500,
    });
  }
}
