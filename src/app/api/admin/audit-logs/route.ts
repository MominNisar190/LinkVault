import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAuditLogs } from "@/lib/audit";
import { successResponse, handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const result = await getAuditLogs({
      page: Number(searchParams.get("page") ?? 1),
      limit: Number(searchParams.get("limit") ?? 50),
    });
    return NextResponse.json(
      successResponse(result.logs, { total: result.total, totalPages: result.pages })
    );
  } catch (err) {
    return NextResponse.json(handleApiError(err), { status: 500 });
  }
}
