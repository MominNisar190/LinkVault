import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import type { UpdateProfileInput, UpdateSettingsInput } from "@/lib/validations";
import type { User, UserRole } from "@prisma/client";

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { email, deletedAt: null } });
  }

  async findWithSettings(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { settings: true },
    });
  }

  async update(id: string, input: UpdateProfileInput): Promise<User> {
    return prisma.user.update({ where: { id }, data: input });
  }

  async updateSettings(userId: string, input: UpdateSettingsInput) {
    return prisma.userSettings.upsert({
      where:  { userId },
      update: input,
      create: { userId, ...input },
    });
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    return prisma.user.update({ where: { id }, data: { role } });
  }

  async ban(id: string, reason: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { isBanned: true, banReason: reason, status: "SUSPENDED" },
    });
  }

  async unban(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { isBanned: false, banReason: null, status: "ACTIVE" },
    });
  }

  async softDelete(id: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async listAll(params: { q?: string; page?: number; limit?: number; role?: UserRole }) {
    const { q, page = 1, limit = 20, role } = params;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(role ? { role } : {}),
      ...(q
        ? {
            OR: [
              { name:  { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take:      limit,
        orderBy:   { createdAt: "desc" },
        select: {
          id:        true,
          email:     true,
          name:      true,
          avatarUrl: true,
          role:      true,
          status:    true,
          isBanned:  true,
          banReason: true,
          createdAt: true,
          _count: { select: { links: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getStats(userId: string) {
    const [totalLinks, agg] = await Promise.all([
      prisma.dynamicLink.count({ where: { userId, deletedAt: null } }),
      prisma.dynamicLink.aggregate({
        where: { userId, deletedAt: null },
        _sum:  { totalClicks: true },
      }),
    ]);
    return { totalLinks, totalClicks: agg._sum.totalClicks ?? 0 };
  }
}

export const userRepository = new UserRepository();
