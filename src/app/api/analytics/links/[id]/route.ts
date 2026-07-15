import { NextRequest, NextResponse } from "next/server";
import { requireAuth, canManageLink } from "@/lib/auth";
import { linkRepository } from "@/repositories/link.repository";
import { prisma } from "@/lib/prisma";
import { successResponse, handleApiError, NotFoundError, ForbiddenError } from "@/lib/errors";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const link = await linkRepository.findById(params.id);
    if (!link) throw new NotFoundError("Link");
    if (!canManageLink(user, link.userId)) throw new ForbiddenError();

    const { searchParams } = new URL(request.url);
    const groupBy = searchParams.get("groupBy") ?? "day";
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : new Date();

    // Time-series data
    const timeSeries = await prisma.$queryRaw<{ date: string; clicks: number }[]>`
      SELECT 
        DATE_TRUNC(${groupBy}, clicked_at) as date,
        COUNT(*)::int as clicks
      FROM analytics
      WHERE link_id = ${params.id}
        AND is_bot = false
        AND clicked_at BETWEEN ${startDate} AND ${endDate}
      GROUP BY DATE_TRUNC(${groupBy}, clicked_at)
      ORDER BY date ASC
    `;

    // Country breakdown
    const countries = await prisma.analytics.groupBy({
      by: ["country"],
      where: { linkId: params.id, isBot: false, country: { not: null } },
      _count: { country: true },
      orderBy: { _count: { country: "desc" } },
      take: 20,
    });

    // OS breakdown
    const operatingSystems = await prisma.analytics.groupBy({
      by: ["os"],
      where: { linkId: params.id, isBot: false, os: { not: null } },
      _count: { os: true },
      orderBy: { _count: { os: "desc" } },
      take: 10,
    });

    // Browser breakdown
    const browsers = await prisma.analytics.groupBy({
      by: ["browser"],
      where: { linkId: params.id, isBot: false, browser: { not: null } },
      _count: { browser: true },
      orderBy: { _count: { browser: "desc" } },
      take: 10,
    });

    // Device breakdown
    const devices = await prisma.analytics.groupBy({
      by: ["device"],
      where: { linkId: params.id, isBot: false },
      _count: { device: true },
      orderBy: { _count: { device: "desc" } },
    });

    // Referrer breakdown
    const referrers = await prisma.analytics.groupBy({
      by: ["refererDomain"],
      where: { linkId: params.id, isBot: false, refererDomain: { not: null } },
      _count: { refererDomain: true },
      orderBy: { _count: { refererDomain: "desc" } },
      take: 10,
    });

    // UTM source breakdown
    const utmSources = await prisma.analytics.groupBy({
      by: ["utmSource"],
      where: { linkId: params.id, isBot: false, utmSource: { not: null } },
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
