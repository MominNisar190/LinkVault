import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { linkRepository } from "@/repositories/link.repository";
import { createAuditLog } from "@/lib/audit";
import { createLinkSchema, searchSchema } from "@/lib/validations";
import { successResponse, errorResponse, handleApiError } from "@/lib/errors";
import { apiRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const ip   = getClientIp(request);
    apiRateLimit(ip);

    const { searchParams } = new URL(request.url);
    const params = searchSchema.parse({
      q:          searchParams.get("q")         ?? undefined,
      page:       searchParams.get("page")      ?? 1,
      limit:      searchParams.get("limit")     ?? 20,
      sortBy:     searchParams.get("sortBy")    ?? undefined,
      sortOrder:  searchParams.get("sortOrder") ?? "desc",
      status:     searchParams.get("status")    ?? undefined,
      projectId:  searchParams.get("projectId") ?? undefined,
    });

    const result = await linkRepository.list(user.id, params);
    return NextResponse.json(
      successResponse(result.links, {
        page:       result.page,
        limit:      result.limit,
        total:      result.total,
        totalPages: result.totalPages,
      })
    );
  } catch (err) {
    return NextResponse.json(handleApiError(err), {
      status: (err as { statusCode?: number }).statusCode ?? 500,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const ip   = getClientIp(request);
    apiRateLimit(ip);

    const body  = await request.json();
    const input = createLinkSchema.parse(body);
    const link  = await linkRepository.create(user.id, input);

    await createAuditLog({
      userId:    user.id,
      action:    "CREATE",
      resource:  "DynamicLink",
      resourceId: link.id,
      metadata:  { slug: link.slug, destination: link.destinationUrl },
      ipAddress: ip,
    });

    return NextResponse.json(successResponse(link), { status: 201 });
  } catch (err) {
    return NextResponse.json(handleApiError(err), {
      status: (err as { statusCode?: number }).statusCode ?? 500,
    });
  }
}
