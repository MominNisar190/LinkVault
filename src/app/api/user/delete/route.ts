import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/hash";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";
import { successResponse, handleApiError } from "@/lib/errors";
import { getClientIp } from "@/lib/rate-limit";

const schema = z.object({ password: z.string().min(1) });

export async function DELETE(request: NextRequest) {
  try {
    const user  = await requireAuth();
    const ip    = getClientIp(request);
    const body  = await request.json();
    const input = schema.parse(body);

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.passwordHash) {
      return NextResponse.json({ success: false, error: "Invalid" }, { status: 400 });
    }

    const valid = await verifyPassword(input.password, dbUser.passwordHash);
    if (!valid) {
      return NextResponse.json({ success: false, error: "Incorrect password" }, { status: 400 });
    }

    await createAuditLog({
      userId: user.id, action: "DELETE", resource: "User", resourceId: user.id, ipAddress: ip,
    });

    // Soft-delete
    await prisma.user.update({
      where: { id: user.id },
      data:  { deletedAt: new Date(), email: `deleted_${user.id}@deleted.invalid` },
    });

    return NextResponse.json(successResponse({ deleted: true }));
  } catch (err) {
    return NextResponse.json(handleApiError(err), {
      status: (err as { statusCode?: number }).statusCode ?? 500,
    });
  }
}

