import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { prisma } from "./prisma";
import { verifyPassword } from "./hash";
import { z } from "zod";

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(1) })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase(), deletedAt: null },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        // Block if not approved yet
        if (user.status === "PENDING") {
          throw new Error("PENDING_APPROVAL");
        }

        if (user.status === "SUSPENDED" || user.isBanned) {
          throw new Error("ACCOUNT_SUSPENDED");
        }

        return {
          id:     user.id,
          email:  user.email,
          name:   user.name,
          image:  user.avatarUrl,
          role:   user.role,
          status: user.status,
        };
      },
    }),
  ],
});

// ─── Server helpers ────────────────────────────────────────────────────────────

import { UnauthorizedError, ForbiddenError } from "./errors";
import type { User, UserRole } from "@prisma/client";

export async function getCurrentUser(): Promise<User | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findFirst({
    where: { id: session.user.id, deletedAt: null },
  });
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError("You must be signed in");
  if (user.isBanned || user.status === "SUSPENDED") throw new ForbiddenError("Account suspended");
  if (user.status === "PENDING") throw new ForbiddenError("Account pending approval");
  return user;
}

export async function requireRole(roles: UserRole[]): Promise<User> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) throw new ForbiddenError("Insufficient permissions");
  return user;
}

export async function requireAdmin(): Promise<User> {
  return requireRole(["ADMIN", "SUPER_ADMIN"]);
}

export function isAdmin(user: User): boolean {
  return user.role === "ADMIN" || user.role === "SUPER_ADMIN";
}

export function canManageLink(user: User, linkUserId: string): boolean {
  return user.id === linkUserId || isAdmin(user);
}

export async function validateApiKey(keyHash: string): Promise<User | null> {
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash, isActive: true },
    include: { user: true },
  });
  if (!apiKey) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;
  if (apiKey.user.isBanned || apiKey.user.status !== "ACTIVE") return null;
  await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
  return apiKey.user;
}
