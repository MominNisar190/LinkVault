import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? undefined;
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 20);
    const skip = (page - 1) * limit;

    const where = q
      ? {
          OR: [
            { slug: { contains: q, mode: "insensitive" as const } },
            { title: { contains: q, mode: "insensitive" as const } },
            { destinationUrl: { contains: q, mode: "insensitive" as const } },
          ],
          deletedAt: null,
        }
      : { deletedAt: null };

    const [links, total] = await Promise.all([
      prisma.dynamicLink.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { analytics: true } },
        },
      }),
      prisma.dynamicLink.count({ where }),
    ]);

    return NextResponse.json(
      successResponse(links, { page, limit, total, totalPages: Math.ceil(total / limit) })
    );
  } catch (err) {
    return NextResponse.json(handleApiError(err), {
      status: (err as { statusCode?: number }).statusCode ?? 500,
    });
  }
}

