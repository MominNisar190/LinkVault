import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { recordVisit } from "@/lib/analytics";
import { verifyPassword } from "@/lib/hash";
import { PasswordGate } from "@/components/redirect/password-gate";
import { RedirectDelay } from "@/components/redirect/redirect-delay";
import { LinkExpired } from "@/components/redirect/link-expired";
import type { Metadata } from "next";

interface Props {
  params:       { slug: string };
  searchParams: Record<string, string>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const link = await prisma.dynamicLink.findUnique({
    where: { slug: params.slug, deletedAt: null },
    select: { ogTitle: true, ogDescription: true, ogImage: true, faviconUrl: true, title: true },
  });
  if (!link) return { title: "Not Found" };
  return {
    title: link.ogTitle ?? link.title ?? "Redirecting…",
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
  const { slug } = params;

  const link = await prisma.dynamicLink.findUnique({
    where: { slug, deletedAt: null },
  });

  if (!link) notFound();

  // Status check
  if (link.status === "INACTIVE" || link.status === "ARCHIVED") notFound();

  // Expiry
  if (link.expiresAt && link.expiresAt < new Date()) {
    return <LinkExpired reason="expired" />;
  }

  // Click limit
  if (link.maxClicks !== null && link.totalClicks >= link.maxClicks) {
    return <LinkExpired reason="click-limit" />;
  }

  // Build destination URL with UTM
  const destUrl = new URL(link.destinationUrl);
  if (link.utmSource   && !destUrl.searchParams.has("utm_source"))   destUrl.searchParams.set("utm_source",   link.utmSource);
  if (link.utmMedium   && !destUrl.searchParams.has("utm_medium"))   destUrl.searchParams.set("utm_medium",   link.utmMedium);
  if (link.utmCampaign && !destUrl.searchParams.has("utm_campaign")) destUrl.searchParams.set("utm_campaign", link.utmCampaign);

  const destination = destUrl.toString();

  // Collect visitor metadata
  const headersList = await headers();
  const userAgent = headersList.get("user-agent")          ?? undefined;
  const referrer  = headersList.get("referer")             ?? undefined;
  const language  = headersList.get("accept-language")?.split(",")[0] ?? undefined;
  const ip        = headersList.get("x-forwarded-for")?.split(",")[0].trim()
                 ?? headersList.get("x-real-ip")            ?? undefined;
  const country   = headersList.get("x-vercel-ip-country") ?? undefined;
  const region    = headersList.get("x-vercel-ip-country-region") ?? undefined;
  const city      = headersList.get("x-vercel-ip-city")    ?? undefined;
  const timezone  = headersList.get("x-vercel-ip-timezone") ?? undefined;

  // Password gate
  if (link.password) {
    const submitted = searchParams.p;
    if (!submitted) {
      return <PasswordGate slug={slug} ogTitle={link.ogTitle ?? link.title ?? undefined} />;
    }
    const valid = await verifyPassword(submitted, link.password);
    if (!valid) {
      return <PasswordGate slug={slug} error="Incorrect password" ogTitle={link.ogTitle ?? link.title ?? undefined} />;
    }
  }

  // Record visit asynchronously — non-blocking
  recordVisit({
    linkId: link.id,
    ip, userAgent, referrer, country, region, city, language, timezone,
    utmSource:   searchParams.utm_source   ?? link.utmSource   ?? undefined,
    utmMedium:   searchParams.utm_medium   ?? link.utmMedium   ?? undefined,
    utmCampaign: searchParams.utm_campaign ?? link.utmCampaign ?? undefined,
    utmTerm:     searchParams.utm_term,
    utmContent:  searchParams.utm_content,
  });

  // Redirect delay
  if (link.redirectDelay > 0) {
    return <RedirectDelay destination={destination} delay={link.redirectDelay} />;
  }

  redirect(destination);
}
