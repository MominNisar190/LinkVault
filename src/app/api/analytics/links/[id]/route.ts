import { NextRequest, NextResponse } from "next/server";
import { requireAuth, canManageLink } from "@/lib/auth";
import { linkRepository } from "@/repositories/link.repository";
import { prisma } from "@/lib/prisma";
import { successResponse, handleApiError, NotFoundError, ForbiddenError } from "@/lib/errors";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const link = await linkRepository.findById(id);
    if (!link) throw new NotFoundError("Link");
    if (!canManageLink(user, link.userId)) throw new ForbiddenError();

    const { searchParams } = new URL(request.url);
    const groupBy = searchParams.get("groupBy") ?? "day";
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : new Date();

    // Time-series data — use Prisma then group in JS to avoid raw SQL column issues
    const rawClicks = await prisma.analytics.findMany({
      where: {
        linkId: id,
        isBot: false,
        clickedAt: { gte: startDate, lte: endDate },
      },
      select: { clickedAt: true },
      orderBy: { clickedAt: "asc" },
    });

    // Group by day/week/month in JS
    const clicksByPeriod = new Map<string, number>();
    for (const row of rawClicks) {
      let key: string;
      const d = row.clickedAt;
      if (groupBy === "month") {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      } else if (groupBy === "week") {
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else {
        key = d.toISOString().split("T")[0];
      }
      clicksByPeriod.set(key, (clicksByPeriod.get(key) ?? 0) + 1);
    }
    const timeSeries = Array.from(clicksByPeriod.entries())
      .map(([date, clicks]) => ({ date, clicks }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Country breakdown
    const countries = await prisma.analytics.groupBy({
      by: ["country"],
      where: { linkId: id, isBot: false, country: { not: null } },
      _count: { country: true },
      orderBy: { _count: { country: "desc" } },
      take: 20,
    });

    const operatingSystems = await prisma.analytics.groupBy({
      by: ["os"],
      where: { linkId: id, isBot: false, os: { not: null } },
      _count: { os: true },
      orderBy: { _count: { os: "desc" } },
      take: 10,
    });

    const browsers = await prisma.analytics.groupBy({
      by: ["browser"],
      where: { linkId: id, isBot: false, browser: { not: null } },
      _count: { browser: true },
      orderBy: { _count: { browser: "desc" } },
      take: 10,
    });

    const devices = await prisma.analytics.groupBy({
      by: ["device"],
      where: { linkId: id, isBot: false },
      _count: { device: true },
      orderBy: { _count: { device: "desc" } },
    });

    const referrers = await prisma.analytics.groupBy({
      by: ["refererDomain"],
      where: { linkId: id, isBot: false, refererDomain: { not: null } },
      _count: { refererDomain: true },
      orderBy: { _count: { refererDomain: "desc" } },
      take: 10,
    });

    const utmSources = await prisma.analytics.groupBy({
      by: ["utmSource"],
      where: { linkId: id, isBot: false, utmSource: { not: null } },
      _count: { utmSource: true },
      orderBy: { _count: { utmSource: "desc" } },
      take: 10,
    });

    return NextResponse.json(
      successResponse({
        timeSeries,
        countries: countries.map((c) => ({ name: c.country!, count: c._count.country })),
        browsers: browsers.map((b) => ({ name: b.browser!, count: b._count.browser })),
        operatingSystems: operatingSystems.map((o) => ({ name: o.os!, count: o._count.os })),
        devices: devices.map((d) => ({ name: d.device, count: d._count.device })),
        referrers: referrers.map((r) => ({ name: r.refererDomain!, count: r._count.refererDomain })),
        utmSources: utmSources.map((u) => ({ name: u.utmSource!, count: u._count.utmSource })),
      })
    );
  } catch (err) {
    return NextResponse.json(handleApiError(err), {
      status: (err as { statusCode?: number }).statusCode ?? 500,
    });
  }
}
