import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { projectRepository } from "@/repositories/project.repository";
import { createProjectSchema } from "@/lib/validations";
import { successResponse, handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const user = await requireAuth();
    const projects = await projectRepository.findAllByUser(user.id);
    return NextResponse.json(successResponse(projects));
  } catch (err) {
    const errResp = handleApiError(err);
    return NextResponse.json(errResp, { status: (err as { statusCode?: number }).statusCode ?? 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const input = createProjectSchema.parse(body);
    const project = await projectRepository.create(user.id, input);
    return NextResponse.json(successResponse(project), { status: 201 });
  } catch (err) {
    const errResp = handleApiError(err);
    return NextResponse.json(errResp, { status: (err as { statusCode?: number }).statusCode ?? 500 });
  }
}
