import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { hashPassword } from "@/lib/hash";
import type { CreateLinkInput, UpdateLinkInput, SearchInput } from "@/lib/validations";
import type { DynamicLink, LinkStatus, Prisma } from "@prisma/client";

export class LinkRepository {
  async findBySlug(slug: string): Promise<DynamicLink | null> {
    return prisma.dynamicLink.findUnique({
      where: { slug, deletedAt: null },
    });
  }

  async findById(id: string): Promise<DynamicLink | null> {
    return prisma.dynamicLink.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByIdWithRelations(id: string) {
    return prisma.dynamicLink.findFirst({
      where: { id, deletedAt: null },
      include: {
        project: { select: { id: true, name: true, color: true } },
        history: { orderBy: { createdAt: "desc" }, take: 10 },
        _count: { select: { analytics: true } },
      },
    });
  }

  async list(userId: string, params: SearchInput) {
    const { q, page, limit, sortBy, sortOrder, status, projectId, tags, startDate, endDate } =
      params;
    const skip = (page - 1) * limit;

    const where: Prisma.DynamicLinkWhereInput = {
      userId,
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
              { destinationUrl: { contains: q, mode: "insensitive" } },
              { tags: { has: q } },
            ],
          }
        : {}),
      ...(status ? { status: status as LinkStatus } : {}),
      ...(projectId ? { projectId } : {}),
      ...(tags && tags.length > 0 ? { tags: { hasSome: tags } } : {}),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    };

    const orderBy: Prisma.DynamicLinkOrderByWithRelationInput =
      sortBy === "clicks"
        ? { totalClicks: sortOrder }
        : sortBy === "title"
          ? { title: sortOrder }
          : sortBy === "slug"
            ? { slug: sortOrder }
            : { createdAt: sortOrder };

    const [links, total] = await Promise.all([
      prisma.dynamicLink.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          project: { select: { id: true, name: true, color: true } },
          _count: { select: { analytics: true } },
        },
      }),
      prisma.dynamicLink.count({ where }),
    ]);

    return {
      links,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(userId: string, input: CreateLinkInput): Promise<DynamicLink> {
    let slug = input.slug ?? generateSlug(6);

    // Ensure unique slug
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.dynamicLink.findUnique({ where: { slug } });
      if (!existing) break;
      if (input.slug) throw new ConflictError(`Slug "${slug}" is already taken`);
      slug = generateSlug(6);
      attempts++;
    }

    const passwordHash = input.password ? await hashPassword(input.password) : undefined;

    return prisma.dynamicLink.create({
      data: {
        userId,
        projectId: input.projectId ?? null,
        slug,
        destinationUrl: input.destinationUrl,
        title: input.title,
        description: input.description,
        password: passwordHash,
        expiresAt: input.expiresAt ?? null,
        maxClicks: input.maxClicks ?? null,
        redirectDelay: input.redirectDelay,
        ogImage: input.ogImage || null,
        ogTitle: input.ogTitle,
        ogDescription: input.ogDescription,
        faviconUrl: input.faviconUrl || null,
        tags: input.tags ?? [],
        notes: input.notes,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        status: "ACTIVE",
      },
    });
  }

  async update(id: string, userId: string, input: Partial<UpdateLinkInput>): Promise<DynamicLink> {
    const link = await this.findById(id);
    if (!link) throw new NotFoundError("Link");

    const passwordHash =
      input.password !== undefined
        ? input.password
          ? await hashPassword(input.password)
          : null
        : undefined;

    // If destination changed, record history
    if (input.destinationUrl && input.destinationUrl !== link.destinationUrl) {
      await prisma.linkHistory.create({
        data: {
          linkId: id,
          userId,
          oldUrl: link.destinationUrl,
          newUrl: input.destinationUrl,
          changeNote: input.changeNote,
        },
      });
    }

    return prisma.dynamicLink.update({
      where: { id },
      data: {
        ...(input.destinationUrl ? { destinationUrl: input.destinationUrl } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(passwordHash !== undefined ? { password: passwordHash } : {}),
        ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt ?? null } : {}),
        ...(input.maxClicks !== undefined ? { maxClicks: input.maxClicks ?? null } : {}),
        ...(input.redirectDelay !== undefined ? { redirectDelay: input.redirectDelay } : {}),
        ...(input.ogImage !== undefined ? { ogImage: input.ogImage || null } : {}),
        ...(input.ogTitle !== undefined ? { ogTitle: input.ogTitle } : {}),
        ...(input.ogDescription !== undefined ? { ogDescription: input.ogDescription } : {}),
        ...(input.faviconUrl !== undefined ? { faviconUrl: input.faviconUrl || null } : {}),
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.projectId !== undefined ? { projectId: input.projectId ?? null } : {}),
      },
    });
  }

  async updateStatus(id: string, status: LinkStatus): Promise<DynamicLink> {
    return prisma.dynamicLink.update({ where: { id }, data: { status } });
  }

  async delete(id: string): Promise<void> {
    await prisma.dynamicLink.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async hardDelete(id: string): Promise<void> {
    await prisma.dynamicLink.delete({ where: { id } });
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await prisma.dynamicLink.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    });
  }

  async bulkUpdateStatus(ids: string[], status: LinkStatus): Promise<void> {
    await prisma.dynamicLink.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
  }

  async duplicate(id: string, userId: string): Promise<DynamicLink> {
    const original = await this.findById(id);
    if (!original) throw new NotFoundError("Link");

    const newSlug = generateSlug(6);
    return prisma.dynamicLink.create({
      data: {
        userId,
        projectId: original.projectId,
        slug: newSlug,
        destinationUrl: original.destinationUrl,
        title: original.title ? `${original.title} (copy)` : undefined,
        description: original.description,
        redirectDelay: original.redirectDelay,
        tags: original.tags,
        notes: original.notes,
        status: "ACTIVE",
      },
    });
  }

  async restoreDestination(linkId: string, historyId: string, userId: string): Promise<DynamicLink> {
    const history = await prisma.linkHistory.findFirst({
      where: { id: historyId, linkId },
      include: { link: true },
    });
    if (!history) throw new NotFoundError("History entry");

    return this.update(linkId, userId, {
      id: linkId,
      destinationUrl: history.oldUrl,
      changeNote: `Restored to: ${history.oldUrl}`,
    });
  }
}

export const linkRepository = new LinkRepository();
