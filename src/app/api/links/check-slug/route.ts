import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    if (!slug) return NextResponse.json(successResponse({ available: false }));

    const existing = await prisma.dynamicLink.findUnique({ where: { slug } });
    return NextResponse.json(successResponse({ available: !existing }));
  } catch (err) {
    return NextResponse.json(handleApiError(err), { status: 500 });
  }
}
