import { prisma } from "./prisma";
import type { AuditAction } from "@prisma/client";

export interface AuditLogData {
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        metadata: (data.metadata ?? {}) as any,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (err) {
    console.error("Failed to create audit log:", err);
  }
}

export async function getAuditLogs(options: {
  userId?: string;
  resource?: string;
  action?: AuditAction;
  limit?: number;
  page?: number;
}) {
  const { userId, resource, action, limit = 50, page = 1 } = options;
  const skip = (page - 1) * limit;

  const where = {
    ...(userId ? { userId } : {}),
    ...(resource ? { resource } : {}),
    ...(action ? { action } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { user: { select: { name: true, email: true, avatarUrl: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, pages: Math.ceil(total / limit) };
}
