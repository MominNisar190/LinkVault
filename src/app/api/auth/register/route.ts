import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { z } from "zod";
import { successResponse, errorResponse } from "@/lib/errors";
import { authRateLimit, getClientIp } from "@/lib/rate-limit";

const registerSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    authRateLimit(ip);

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse("Validation failed", "VALIDATION_ERROR"),
        { status: 422 }
      );
    }

    const { name, email, password } = parsed.data;

    // Check if email already in use
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        errorResponse("An account with this email already exists.", "EMAIL_TAKEN"),
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // First ever user becomes SUPER_ADMIN and is auto-approved
    const userCount = await prisma.user.count();
    const isFirst = userCount === 0;

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role:   isFirst ? "SUPER_ADMIN" : "USER",
        status: isFirst ? "ACTIVE" : "PENDING",
        emailVerified: false,
        settings: { create: {} },
      },
    });

    return NextResponse.json(
      successResponse({
        message: isFirst
          ? "Admin account created. You can now sign in."
          : "Account created successfully. Please wait for admin approval.",
        pendingApproval: !isFirst,
      }),
      { status: 201 }
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(errorResponse("Registration failed"), { status: 500 });
  }
}
