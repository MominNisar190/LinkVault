import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { recordVisit } from "@/lib/analytics";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * Cache link lookups for 60 seconds.
 * Warm cache = zero DB latency on the critical redirect path.
 */
const getCachedLink = unstable_cache(
  (slug: string) =>
    prisma.dynamicLink.findUnique({ where: { slug, deletedAt: null } }),
  ["redirect-link-slug"],
  { revalidate: 60, tags: ["dynamic-link"] }
);

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const { searchParams } = request.nextUrl;

  const link = await getCachedLink(slug);

  // Not found → let the page.tsx 404 handle it
  if (!link) return NextResponse.next();

  // Inactive/archived → let page.tsx handle it
  if (link.status === "INACTIVE" || link.status === "ARCHIVED") {
    return NextResponse.next();
  }

  // Expired → let page.tsx render the expired UI
  if (link.expiresAt && link.expiresAt < new Date()) {
    return NextResponse.next();
  }

  // Click limit → let page.tsx render the limit UI
  if (link.maxClicks !== null && link.totalClicks >= link.maxClicks) {
    return NextResponse.next();
  }

  // Password protected → let page.tsx render the password gate
  if (link.password) {
    return NextResponse.next();
  }

  // Redirect delay → let page.tsx render the countdown
  if (link.redirectDelay > 0) {
    return NextResponse.next();
  }

  // ── FAST PATH: build destination and fire immediate 302 ──────────────────

  const destUrl = new URL(link.destinationUrl);
  if (link.utmSource   && !destUrl.searchParams.has("utm_source"))   destUrl.searchParams.set("utm_source",   link.utmSource);
  if (link.utmMedium   && !destUrl.searchParams.has("utm_medium"))   destUrl.searchParams.set("utm_medium",   link.utmMedium);
  if (link.utmCampaign && !destUrl.searchParams.has("utm_campaign")) destUrl.searchParams.set("utm_campaign", link.utmCampaign);

  const destination = destUrl.toString();

  // Collect visitor metadata from request headers (available in Route Handler)
  const ip        = request.headers.get("x-forwarded-for")?.split(",")[0].trim()
                 ?? request.headers.get("x-real-ip")            ?? undefined;
  const userAgent = request.headers.get("user-agent")           ?? undefined;
  const referrer  = request.headers.get("referer")              ?? undefined;
  const language  = request.headers.get("accept-language")?.split(",")[0] ?? undefined;
  const country   = request.headers.get("x-vercel-ip-country") ?? undefined;
  const region    = request.headers.get("x-vercel-ip-country-region") ?? undefined;
  const city      = request.headers.get("x-vercel-ip-city")    ?? undefined;
  const timezone  = request.headers.get("x-vercel-ip-timezone") ?? undefined;

  // Fire analytics completely in the background — never blocks the redirect
  recordVisit({
    linkId: link.id,
    ip, userAgent, referrer, country, region, city, language, timezone,
    utmSource:   searchParams.get("utm_source")   ?? link.utmSource   ?? undefined,
    utmMedium:   searchParams.get("utm_medium")   ?? link.utmMedium   ?? undefined,
    utmCampaign: searchParams.get("utm_campaign") ?? link.utmCampaign ?? undefined,
    utmTerm:     searchParams.get("utm_term")     ?? undefined,
    utmContent:  searchParams.get("utm_content")  ?? undefined,
  }).catch((err) => console.error("Background recordVisit failed:", err));

  // Return a 302 immediately — no React rendering, fastest possible response
  return NextResponse.redirect(destination, {
    status: 302,
    headers: {
      // Prevent browsers from caching the redirect — destination can change
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Redirect-By": "LinkVault",
    },
  });
}
