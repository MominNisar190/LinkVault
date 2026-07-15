import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import type { CreateProjectInput, UpdateProjectInput } from "@/lib/validations";
import type { Project } from "@prisma/client";

export class ProjectRepository {
  async findById(id: string): Promise<Project | null> {
    return prisma.project.findFirst({ where: { id, deletedAt: null } });
  }

  async findAllByUser(userId: string) {
    return prisma.project.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      include: {
        _count: { select: { links: { where: { deletedAt: null } } } },
      },
    });
  }

  async create(userId: string, input: CreateProjectInput): Promise<Project> {
    return prisma.project.create({
      data: { userId, ...input },
    });
  }

  async update(id: string, input: Partial<UpdateProjectInput>): Promise<Project> {
    const project = await this.findById(id);
    if (!project) throw new NotFoundError("Project");
    return prisma.project.update({ where: { id }, data: input });
  }

  async delete(id: string): Promise<void> {
    const project = await this.findById(id);
    if (!project) throw new NotFoundError("Project");
    if (project.isDefault) throw new Error("Cannot delete the default project");

    // Move links to null project
    await prisma.dynamicLink.updateMany({ where: { projectId: id }, data: { projectId: null } });
    await prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export const projectRepository = new ProjectRepository();
