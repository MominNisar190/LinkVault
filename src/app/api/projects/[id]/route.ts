import { NextRequest, NextResponse } from "next/server";
import { requireAuth, canManageLink } from "@/lib/auth";
import { projectRepository } from "@/repositories/project.repository";
import { updateProjectSchema } from "@/lib/validations";
import { successResponse, handleApiError, NotFoundError, ForbiddenError } from "@/lib/errors";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const project = await projectRepository.findById(params.id);
    if (!project) throw new NotFoundError("Project");
    if (project.userId !== user.id) throw new ForbiddenError();

    const body = await request.json();
    const input = updateProjectSchema.parse({ ...body, id: params.id });
    const updated = await projectRepository.update(params.id, input);
    return NextResponse.json(successResponse(updated));
  } catch (err) {
    const errResp = handleApiError(err);
    return NextResponse.json(errResp, { status: (err as { statusCode?: number }).statusCode ?? 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const project = await projectRepository.findById(params.id);
    if (!project) throw new NotFoundError("Project");
    if (project.userId !== user.id) throw new ForbiddenError();

    await projectRepository.delete(params.id);
    return NextResponse.json(successResponse({ deleted: true }));
  } catch (err) {
    const errResp = handleApiError(err);
    return NextResponse.json(errResp, { status: (err as { statusCode?: number }).statusCode ?? 500 });
  }
}
