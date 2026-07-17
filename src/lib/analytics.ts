import { prisma } from "./prisma";
import { parseUserAgent } from "./utils";
import type { DeviceType } from "@prisma/client";

export interface VisitData {
  linkId: string;
  ip?: string;
  userAgent?: string;
  referrer?: string;
  country?: string;
  region?: string;
  city?: string;
  language?: string;
  timezone?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  screenWidth?: number;
  screenHeight?: number;
}

function generateFingerprint(ip?: string, userAgent?: string): string {
  const base = `${ip ?? ""}:${userAgent ?? ""}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    const char = base.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function isBot(userAgent?: string): boolean {
  if (!userAgent) return false;
  const botPatterns = /bot|crawler|spider|scraper|slurp|mediapartners|googlebot|bingbot|yahoo/i;
  return botPatterns.test(userAgent);
}

export async function recordVisit(data: VisitData): Promise<void> {
  try {
    const { browser, os, device } = parseUserAgent(data.userAgent ?? "");
    const fingerprint = generateFingerprint(data.ip, data.userAgent);
    const botDetected = isBot(data.userAgent);

    const deviceType: DeviceType =
      device === "MOBILE"
        ? "MOBILE"
        : device === "TABLET"
          ? "TABLET"
          : device === "DESKTOP"
            ? "DESKTOP"
            : "UNKNOWN";

    // Extract referrer domain up-front (CPU only, no I/O)
    let refererDomain: string | undefined;
    if (data.referrer) {
      try {
        refererDomain = new URL(data.referrer).hostname;
      } catch {
        refererDomain = undefined;
      }
    }

    // Upsert visitor first — we need the result to know isUnique and get visitorId
    const visitor = await prisma.visitor.upsert({
      where: { linkId_fingerprint: { linkId: data.linkId, fingerprint } },
      update: { lastSeen: new Date(), totalVisits: { increment: 1 } },
      create: {
        linkId: data.linkId,
        fingerprint,
        ip: data.ip,
        firstSeen: new Date(),
        lastSeen: new Date(),
        totalVisits: 1,
      },
    });

    const isUnique = visitor.totalVisits === 1;
    const now = new Date();

    // Run analytics insert and link counter update in parallel — saves one full DB round-trip
    await Promise.all([
      prisma.analytics.create({
        data: {
          linkId: data.linkId,
          visitorId: visitor.id,
          ip: data.ip,
          userAgent: data.userAgent,
          browser,
          os,
          device: deviceType,
          country: data.country,
          region: data.region,
          city: data.city,
          referrer: data.referrer,
          refererDomain,
          language: data.language,
          timezone: data.timezone,
          utmSource: data.utmSource,
          utmMedium: data.utmMedium,
          utmCampaign: data.utmCampaign,
          utmTerm: data.utmTerm,
          utmContent: data.utmContent,
          screenWidth: data.screenWidth,
          screenHeight: data.screenHeight,
          isUnique,
          isBot: botDetected,
          clickedAt: now,
        },
      }),
      prisma.dynamicLink.update({
        where: { id: data.linkId },
        data: {
          totalClicks: { increment: 1 },
          ...(isUnique ? { uniqueClicks: { increment: 1 } } : {}),
        },
      }),
    ]);
  } catch (err) {
    console.error("Failed to record visit:", err);
  }
}

export async function getLinkAnalyticsSummary(linkId: string, userId: string) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [total, today, month, unique, topCountries, topBrowsers, topDevices, topReferrers] =
    await Promise.all([
      prisma.analytics.count({ where: { linkId, isBot: false } }),
      prisma.analytics.count({
        where: { linkId, isBot: false, clickedAt: { gte: startOfToday } },
      }),
      prisma.analytics.count({
        where: { linkId, isBot: false, clickedAt: { gte: startOfMonth } },
      }),
      prisma.analytics.count({ where: { linkId, isUnique: true, isBot: false } }),
      prisma.analytics.groupBy({
        by: ["country"],
        where: { linkId, isBot: false, country: { not: null }, clickedAt: { gte: last30Days } },
        _count: { country: true },
        orderBy: { _count: { country: "desc" } },
        take: 10,
      }),
      prisma.analytics.groupBy({
        by: ["browser"],
        where: { linkId, isBot: false, browser: { not: null }, clickedAt: { gte: last30Days } },
        _count: { browser: true },
        orderBy: { _count: { browser: "desc" } },
        take: 10,
      }),
      prisma.analytics.groupBy({
        by: ["device"],
        where: { linkId, isBot: false, clickedAt: { gte: last30Days } },
        _count: { device: true },
        orderBy: { _count: { device: "desc" } },
        take: 5,
      }),
      prisma.analytics.groupBy({
        by: ["refererDomain"],
        where: {
          linkId,
          isBot: false,
          refererDomain: { not: null },
          clickedAt: { gte: last30Days },
        },
        _count: { refererDomain: true },
        orderBy: { _count: { refererDomain: "desc" } },
        take: 10,
      }),
    ]);

  return {
    total,
    today,
    month,
    unique,
    topCountries: topCountries.map((c) => ({ country: c.country!, count: c._count.country })),
    topBrowsers: topBrowsers.map((b) => ({ browser: b.browser!, count: b._count.browser })),
    topDevices: topDevices.map((d) => ({ device: d.device, count: d._count.device })),
    topReferrers: topReferrers.map((r) => ({
      referrer: r.refererDomain!,
      count: r._count.refererDomain,
    })),
  };
}

export async function getDashboardStats(userId: string) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const prev30Days = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const userLinks = await prisma.dynamicLink.findMany({
    where: { userId, deletedAt: null },
    select: { id: true },
  });
  const linkIds = userLinks.map((l) => l.id);

  const [
    totalLinks,
    activeLinks,
    todayClicks,
    monthClicks,
    uniqueVisitors,
    prevMonthClicks,
    topLinks,
    recentActivity,
    clicksOverTime,
  ] = await Promise.all([
    prisma.dynamicLink.count({ where: { userId, deletedAt: null } }),
    prisma.dynamicLink.count({ where: { userId, status: "ACTIVE", deletedAt: null } }),
    prisma.analytics.count({
      where: { linkId: { in: linkIds }, isBot: false, clickedAt: { gte: startOfToday } },
    }),
    prisma.analytics.count({
      where: { linkId: { in: linkIds }, isBot: false, clickedAt: { gte: startOfMonth } },
    }),
    prisma.analytics.count({
      where: { linkId: { in: linkIds }, isUnique: true, isBot: false },
    }),
    prisma.analytics.count({
      where: {
        linkId: { in: linkIds },
        isBot: false,
        clickedAt: { gte: prev30Days, lt: last30Days },
      },
    }),
    prisma.dynamicLink.findMany({
      where: { userId, deletedAt: null },
      orderBy: { totalClicks: "desc" },
      take: 5,
      select: { id: true, slug: true, title: true, destinationUrl: true, totalClicks: true },
    }),
    prisma.analytics.findMany({
      where: { linkId: { in: linkIds }, isBot: false },
      orderBy: { clickedAt: "desc" },
      take: 10,
      select: { clickedAt: true, country: true, browser: true, linkId: true },
    }),
    // clicks grouped by day for the last 30 days
    prisma.analytics.findMany({
      where: {
        linkId: { in: linkIds },
        isBot: false,
        clickedAt: { gte: last30Days },
      },
      select: { clickedAt: true },
      orderBy: { clickedAt: "asc" },
    }),
  ]);

  const clickGrowth =
    prevMonthClicks === 0
      ? 100
      : Math.round(((monthClicks - prevMonthClicks) / prevMonthClicks) * 100);

  // Group clicks by day in JS (avoids raw SQL)
  const clicksByDay = new Map<string, number>();
  for (const row of clicksOverTime) {
    const date = row.clickedAt.toISOString().split("T")[0];
    clicksByDay.set(date, (clicksByDay.get(date) ?? 0) + 1);
  }
  const clicksOverTimeGrouped = Array.from(clicksByDay.entries())
    .map(([date, clicks]) => ({ date, clicks }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalLinks,
    activeLinks,
    todayClicks,
    monthClicks,
    uniqueVisitors,
    clickGrowth,
    topLinks,
    recentActivity,
    clicksOverTime: clicksOverTimeGrouped,
  };
}
