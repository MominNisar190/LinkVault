import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { userRepository } from "@/repositories/user.repository";
import { updateSettingsSchema } from "@/lib/validations";
import { successResponse, handleApiError } from "@/lib/errors";

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const input = updateSettingsSchema.parse(body);
    const settings = await userRepository.updateSettings(user.id, input);
    return NextResponse.json(successResponse(settings));
  } catch (err) {
    const errResp = handleApiError(err);
    return NextResponse.json(errResp, { status: (err as { statusCode?: number }).statusCode ?? 500 });
  }
}
