import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { linkRepository } from "@/repositories/link.repository";
import { createAuditLog } from "@/lib/audit";
import { bulkActionSchema } from "@/lib/validations";
import { successResponse, handleApiError } from "@/lib/errors";
import { getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const ip = getClientIp(request);
    const body = await request.json();
    const { ids, action } = bulkActionSchema.parse(body);

    switch (action) {
      case "delete":
        await linkRepository.bulkDelete(ids);
        break;
      case "archive":
        await linkRepository.bulkUpdateStatus(ids, "ARCHIVED");
        break;
      case "enable":
        await linkRepository.bulkUpdateStatus(ids, "ACTIVE");
        break;
      case "disable":
        await linkRepository.bulkUpdateStatus(ids, "INACTIVE");
        break;
      case "restore":
        await linkRepository.bulkUpdateStatus(ids, "ACTIVE");
        break;
    }

    await createAuditLog({
      userId: user.id,
      action: action === "delete" ? "BULK_DELETE" : "BULK_UPDATE",
      resource: "DynamicLink",
      metadata: { ids, action },
      ipAddress: ip,
    });

    return NextResponse.json(successResponse({ affected: ids.length }));
  } catch (err) {
    const errResp = handleApiError(err);
    return NextResponse.json(errResp, { status: (err as { statusCode?: number }).statusCode ?? 500 });
  }
}

