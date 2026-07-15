import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    await requireAdmin();

    const [
      totalUsers, totalLinks, totalClicks, activeLinks,
      bannedUsers, pendingUsers, recentLinks, recentUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.dynamicLink.count({ where: { deletedAt: null } }),
      prisma.analytics.count({ where: { isBot: false } }),
      prisma.dynamicLink.count({ where: { status: "ACTIVE", deletedAt: null } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.user.count({ where: { status: "PENDING", deletedAt: null } }),
      prisma.dynamicLink.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, slug: true, title: true, totalClicks: true, createdAt: true },
      }),
      prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, createdAt: true, role: true, status: true },
      }),
    ]);

    return NextResponse.json(
      successResponse({
        totalUsers, totalLinks, totalClicks,
        activeLinks, bannedUsers, pendingUsers,
        recentLinks, recentUsers,
      })
    );
  } catch (err) {
    return NextResponse.json(handleApiError(err), {
      status: (err as { statusCode?: number }).statusCode ?? 500,
    });
  }
}

