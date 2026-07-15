import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/hash";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";
import { successResponse, handleApiError } from "@/lib/errors";
import { getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const user  = await requireAuth();
    const ip    = getClientIp(request);
    const body  = await request.json();
    const input = schema.parse(body);

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.passwordHash) {
      return NextResponse.json(
        { success: false, error: "No password set on this account" },
        { status: 400 }
      );
    }

    const valid = await verifyPassword(input.currentPassword, dbUser.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(input.newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data:  { passwordHash: newHash },
    });

    await createAuditLog({
      userId:    user.id,
      action:    "PASSWORD_CHANGE",
      resource:  "User",
      resourceId: user.id,
      ipAddress: ip,
    });

    return NextResponse.json(successResponse({ changed: true }));
  } catch (err) {
    return NextResponse.json(handleApiError(err), {
      status: (err as { statusCode?: number }).statusCode ?? 500,
    });
  }
}
