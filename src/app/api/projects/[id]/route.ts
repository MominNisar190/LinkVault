import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { projectRepository } from "@/repositories/project.repository";
import { updateProjectSchema } from "@/lib/validations";
import { successResponse, handleApiError, NotFoundError, ForbiddenError } from "@/lib/errors";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const project = await projectRepository.findById(id);
    if (!project) throw new NotFoundError("Project");
    if (project.userId !== user.id) throw new ForbiddenError();
    const body = await request.json();
    const input = updateProjectSchema.parse({ ...body, id });
    const updated = await projectRepository.update(id, input);
    return NextResponse.json(successResponse(updated));
  } catch (err) {
    return NextResponse.json(handleApiError(err), { status: (err as any).statusCode ?? 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const project = await projectRepository.findById(id);
    if (!project) throw new NotFoundError("Project");
    if (project.userId !== user.id) throw new ForbiddenError();
    await projectRepository.delete(id);
    return NextResponse.json(successResponse({ deleted: true }));
  } catch (err) {
    return NextResponse.json(handleApiError(err), { status: (err as any).statusCode ?? 500 });
  }
}
