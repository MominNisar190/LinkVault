import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validations";
import { successResponse, handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const user = await requireAuth();
    const full = await prisma.user.findFirst({
      where: { id: user.id, deletedAt: null },
      include: { settings: true },
      omit: { passwordHash: true },
    } as any);
    return NextResponse.json(successResponse(full));
  } catch (err) {
    return NextResponse.json(handleApiError(err), {
      status: (err as { statusCode?: number }).statusCode ?? 500,
    });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const input = updateProfileSchema.parse(body);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: input,
      omit: { passwordHash: true },
    } as any);
    return NextResponse.json(successResponse(updated));
  } catch (err) {
    return NextResponse.json(handleApiError(err), {
      status: (err as { statusCode?: number }).statusCode ?? 500,
    });
  }
}

