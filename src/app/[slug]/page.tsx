/**
 * This page only handles special-case redirects that need UI:
 *   - Password-protected links  → renders <PasswordGate>
 *   - Redirect delay links      → renders <RedirectDelay>
 *   - Expired links             → renders <LinkExpired>
 *   - Inactive / archived       → notFound()
 *
 * Normal (fast) redirects are handled by route.ts which issues an
 * immediate HTTP 302 before any React rendering occurs.
 */
import { redirect, notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { recordVisit } from "@/lib/analytics";
import { verifyPassword } from "@/lib/hash";
import { headers } from "next/headers";
import { PasswordGate } from "@/components/redirect/password-gate";
import { RedirectDelay } from "@/components/redirect/redirect-delay";
import { LinkExpired } from "@/components/redirect/link-expired";
import type { Metadata } from "next";

interface Props {
  params:       Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string>>;
}

const getCachedLink = unstable_cache(
  (slug: string) =>
    prisma.dynamicLink.findUnique({ where: { slug, deletedAt: null } }),
  ["redirect-link-slug"],
  { revalidate: 60, tags: ["dynamic-link"] }
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const link = await getCachedLink(slug);
  if (!link) return { title: "Not Found" };
  return {
    title:       link.ogTitle ?? link.title ?? "Redirecting…",
    description: link.ogDescription ?? undefined,
    openGraph: {
      title:       link.ogTitle ?? link.title ?? undefined,
      description: link.ogDescription ?? undefined,
      images:      link.ogImage ? [{ url: link.ogImage }] : [],
    },
    icons: link.faviconUrl ? [{ url: link.faviconUrl }] : undefined,
  };
}

export default async function SlugPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp       = await searchParams;

  const [link, headersList] = await Promise.all([
    getCachedLink(slug),
    headers(),
  ]);

  if (!link) notFound();

  if (link.status === "INACTIVE" || link.status === "ARCHIVED") notFound();

  if (link.expiresAt && link.expiresAt < new Date()) {
    return <LinkExpired reason="expired" />;
  }

  if (link.maxClicks !== null && link.totalClicks >= link.maxClicks) {
    return <LinkExpired reason="click-limit" />;
  }

  // Build destination URL with UTM
  const destUrl = new URL(link.destinationUrl);
  if (link.utmSource   && !destUrl.searchParams.has("utm_source"))   destUrl.searchParams.set("utm_source",   link.utmSource);
  if (link.utmMedium   && !destUrl.searchParams.has("utm_medium"))   destUrl.searchParams.set("utm_medium",   link.utmMedium);
  if (link.utmCampaign && !destUrl.searchParams.has("utm_campaign")) destUrl.searchParams.set("utm_campaign", link.utmCampaign);

  const destination = destUrl.toString();

  const ip        = headersList.get("x-forwarded-for")?.split(",")[0].trim()
                 ?? headersList.get("x-real-ip")            ?? undefined;
  const userAgent = headersList.get("user-agent")           ?? undefined;
  const referrer  = headersList.get("referer")              ?? undefined;
  const language  = headersList.get("accept-language")?.split(",")[0] ?? undefined;
  const country   = headersList.get("x-vercel-ip-country") ?? undefined;
  const region    = headersList.get("x-vercel-ip-country-region") ?? undefined;
  const city      = headersList.get("x-vercel-ip-city")    ?? undefined;
  const timezone  = headersList.get("x-vercel-ip-timezone") ?? undefined;

  // ── Password gate ─────────────────────────────────────────────────────────
  if (link.password) {
    const submitted = sp.p;
    if (!submitted) {
      return <PasswordGate slug={slug} ogTitle={link.ogTitle ?? link.title ?? undefined} />;
    }
    const valid = await verifyPassword(submitted, link.password);
    if (!valid) {
      return (
        <PasswordGate
          slug={slug}
          error="Incorrect password"
          ogTitle={link.ogTitle ?? link.title ?? undefined}
        />
      );
    }
    // Password correct — record visit then redirect
    recordVisit({
      linkId: link.id,
      ip, userAgent, referrer, country, region, city, language, timezone,
      utmSource:   sp.utm_source   ?? link.utmSource   ?? undefined,
      utmMedium:   sp.utm_medium   ?? link.utmMedium   ?? undefined,
      utmCampaign: sp.utm_campaign ?? link.utmCampaign ?? undefined,
      utmTerm:     sp.utm_term,
      utmContent:  sp.utm_content,
    }).catch((err) => console.error("Background recordVisit failed:", err));

    redirect(destination);
  }

  // ── Redirect delay ────────────────────────────────────────────────────────
  if (link.redirectDelay > 0) {
    // Record the visit when the delay page loads (user will see the countdown)
    recordVisit({
      linkId: link.id,
      ip, userAgent, referrer, country, region, city, language, timezone,
      utmSource:   sp.utm_source   ?? link.utmSource   ?? undefined,
      utmMedium:   sp.utm_medium   ?? link.utmMedium   ?? undefined,
      utmCampaign: sp.utm_campaign ?? link.utmCampaign ?? undefined,
      utmTerm:     sp.utm_term,
      utmContent:  sp.utm_content,
    }).catch((err) => console.error("Background recordVisit failed:", err));

    return <RedirectDelay destination={destination} delay={link.redirectDelay} />;
  }

  // Fallback: shouldn't reach here for normal links (route.ts handles those),
  // but kept as a safety net.
  recordVisit({
    linkId: link.id,
    ip, userAgent, referrer, country, region, city, language, timezone,
  }).catch((err) => console.error("Background recordVisit failed:", err));

  redirect(destination);
}
