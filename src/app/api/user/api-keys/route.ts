import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { createApiKeySchema } from "@/lib/validations";
import { generateApiKey } from "@/lib/utils";
import { hashApiKey } from "@/lib/hash";
import { successResponse, handleApiError } from "@/lib/errors";
import { getClientIp } from "@/lib/rate-limit";

export async function GET() {
  try {
    const user = await requireAuth();
    const keys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });
    return NextResponse.json(successResponse(keys));
  } catch (err) {
    return NextResponse.json(handleApiError(err), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const ip = getClientIp(request);
    const body = await request.json();
    const input = createApiKeySchema.parse(body);

    const { key, prefix } = generateApiKey();
    const keyHash = hashApiKey(key);

    await prisma.apiKey.create({
      data: {
        userId: user.id,
        name: input.name,
        keyHash,
        keyPrefix: prefix,
        scopes: input.scopes,
        expiresAt: input.expiresAt ?? null,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "API_KEY_CREATE",
      resource: "ApiKey",
      metadata: { name: input.name },
      ipAddress: ip,
    });

    // Return the raw key ONCE — never stored in plain text again
    return NextResponse.json(successResponse({ key, prefix }), { status: 201 });
  } catch (err) {
    return NextResponse.json(handleApiError(err), { status: 500 });
  }
}

