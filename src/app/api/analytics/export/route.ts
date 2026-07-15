import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get("linkId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const userLinks = await prisma.dynamicLink.findMany({
      where: { userId: user.id, deletedAt: null },
      select: { id: true },
    });
    const allowedIds = userLinks.map((l) => l.id);

    const where = {
      linkId: linkId ? linkId : { in: allowedIds },
      ...(startDate || endDate
        ? {
            clickedAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    };

    const rows = await prisma.analytics.findMany({
      where,
      orderBy: { clickedAt: "desc" },
      take: 10000,
      select: {
        clickedAt: true,
        country: true,
        region: true,
        city: true,
        browser: true,
        os: true,
        device: true,
        referrer: true,
        isUnique: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        link: { select: { slug: true, title: true } },
      },
    });

    const header =
      "date,slug,title,country,region,city,browser,os,device,referrer,unique,utm_source,utm_medium,utm_campaign\n";

    const csv =
      header +
      rows
        .map(
          (r) =>
            [
              r.clickedAt.toISOString(),
              r.link.slug,
              `"${(r.link.title ?? "").replace(/"/g, '""')}"`,
              r.country ?? "",
              r.region ?? "",
              r.city ?? "",
              r.browser ?? "",
              r.os ?? "",
              r.device ?? "",
              `"${(r.referrer ?? "").replace(/"/g, '""')}"`,
              r.isUnique ? "1" : "0",
              r.utmSource ?? "",
              r.utmMedium ?? "",
              r.utmCampaign ?? "",
            ].join(",")
        )
        .join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="analytics-${Date.now()}.csv"`,
      },
    });
  } catch (err) {
    return NextResponse.json(handleApiError(err), { status: 500 });
  }
}

