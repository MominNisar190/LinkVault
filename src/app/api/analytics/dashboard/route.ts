import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getDashboardStats } from "@/lib/analytics";
import { successResponse, handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const user  = await requireAuth();
    const stats = await getDashboardStats(user.id);
    return NextResponse.json(successResponse(stats));
  } catch (err) {
    return NextResponse.json(handleApiError(err), {
      status: (err as { statusCode?: number }).statusCode ?? 500,
    });
  }
}

