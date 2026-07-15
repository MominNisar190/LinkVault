import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, handleApiError, NotFoundError } from "@/lib/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Full user profile
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        status: true,
        isBanned: true,
        banReason: true,
        emailVerified: true,
        timezone: true,
        locale: true,
        createdAt: true,
        updatedAt: true,
        settings: true,
        _count: { select: { links: true, apiKeys: true, auditLogs: true } },
      },
    });
    if (!user) throw new NotFoundError("User");

    // All links for this user (not deleted)
    const links = await prisma.dynamicLink.findMany({
      where: { userId: id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        destinationUrl: true,
        status: true,
        totalClicks: true,
        uniqueClicks: true,
        tags: true,
        expiresAt: true,
        maxClicks: true,
        createdAt: true,
        updatedAt: true,
        project: { select: { id: true, name: true, color: true } },
        _count: { select: { analytics: true } },
      },
    });

    // Link history (before/after destination edits) for this user
    const linkHistory = await prisma.linkHistory.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        linkId: true,
        oldUrl: true,
        newUrl: true,
        changeNote: true,
        createdAt: true,
        link: { select: { slug: true, title: true } },
      },
    });

    // Analytics summary across all user links
    const linkIds = links.map((l) => l.id);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30Days   = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalClicks,
      todayClicks,
      monthClicks,
      uniqueVisitors,
      topCountries,
      topBrowsers,
      topDevices,
      clicksOverTime,
    ] = await Promise.all([
      prisma.analytics.count({ where: { linkId: { in: linkIds }, isBot: false } }),
      prisma.analytics.count({
        where: { linkId: { in: linkIds }, isBot: false, clickedAt: { gte: startOfToday } },
      }),
      prisma.analytics.count({
        where: { linkId: { in: linkIds }, isBot: false, clickedAt: { gte: startOfMonth } },
      }),
      prisma.analytics.count({ where: { linkId: { in: linkIds }, isUnique: true, isBot: false } }),
      prisma.analytics.groupBy({
        by: ["country"],
        where: { linkId: { in: linkIds }, isBot: false, country: { not: null }, clickedAt: { gte: last30Days } },
        _count: { country: true },
        orderBy: { _count: { country: "desc" } },
        take: 10,
      }),
      prisma.analytics.groupBy({
        by: ["browser"],
        where: { linkId: { in: linkIds }, isBot: false, browser: { not: null }, clickedAt: { gte: last30Days } },
        _count: { browser: true },
        orderBy: { _count: { browser: "desc" } },
        take: 8,
      }),
      prisma.analytics.groupBy({
        by: ["device"],
        where: { linkId: { in: linkIds }, isBot: false, clickedAt: { gte: last30Days } },
        _count: { device: true },
        orderBy: { _count: { device: "desc" } },
        take: 5,
      }),
      // Clicks per day for last 30 days
      prisma.analytics.findMany({
        where: { linkId: { in: linkIds }, isBot: false, clickedAt: { gte: last30Days } },
        select: { clickedAt: true },
        orderBy: { clickedAt: "asc" },
      }),
    ]);

    // Group clicks by day in JS
    const byDay = new Map<string, number>();
    for (const row of clicksOverTime) {
      const date = row.clickedAt.toISOString().split("T")[0];
      byDay.set(date, (byDay.get(date) ?? 0) + 1);
    }
    const clicksChart = Array.from(byDay.entries())
      .map(([date, clicks]) => ({ date, clicks }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Recent audit logs for this user
    const auditLogs = await prisma.auditLog.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        action: true,
        resource: true,
        resourceId: true,
        metadata: true,
        ipAddress: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      successResponse({
        user,
        links,
        linkHistory,
        analytics: {
          totalClicks,
          todayClicks,
          monthClicks,
          uniqueVisitors,
          topCountries: topCountries.map((c) => ({ country: c.country!, count: c._count.country })),
          topBrowsers:  topBrowsers.map((b)  => ({ browser: b.browser!,  count: b._count.browser  })),
          topDevices:   topDevices.map((d)   => ({ device: d.device,     count: d._count.device   })),
          clicksChart,
        },
        auditLogs,
      })
    );
  } catch (err) {
    return NextResponse.json(handleApiError(err), {
      status: (err as { statusCode?: number }).statusCode ?? 500,
    });
  }
}
