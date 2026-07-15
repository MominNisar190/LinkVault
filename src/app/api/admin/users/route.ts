import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/errors";
import type { AccountStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const q      = searchParams.get("q")      ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const page   = Number(searchParams.get("page")  ?? 1);
    const limit  = Number(searchParams.get("limit") ?? 20);
    const skip   = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(status ? { status: status as AccountStatus } : {}),
      ...(q
        ? {
            OR: [
              { name:  { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take:      limit,
        orderBy:   { createdAt: "desc" },
        select: {
          id:         true,
          email:      true,
          name:       true,
          avatarUrl:  true,
          role:       true,
          status:     true,
          isBanned:   true,
          banReason:  true,
          createdAt:  true,
          _count: { select: { links: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json(
      successResponse(users, { page, limit, total, totalPages: Math.ceil(total / limit) })
    );
  } catch (err) {
    return NextResponse.json(handleApiError(err), {
      status: (err as { statusCode?: number }).statusCode ?? 500,
    });
  }
}

