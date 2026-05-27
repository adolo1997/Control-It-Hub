import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { createSessionToken, sessionCookieName } from "@/lib/session-token";

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase().trim()),
  password: z.string().min(8),
});

const attempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const current = attempts.get(ip);

  if (!current || current.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }

  current.count += 1;
  return current.count > 10;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    include: {
      memberships: {
        include: { company: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const validPassword = user
    ? await bcrypt.compare(parsed.data.password, user.passwordHash)
    : false;

  if (!user || !user.isActive || !validPassword || user.memberships.length === 0) {
    await db.auditLog.create({
      data: {
        action: "auth.login_failed",
        entity: "User",
        ipAddress: ip,
        userAgent: request.headers.get("user-agent"),
        metadata: { email: parsed.data.email },
      },
    });
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const membership = user.memberships[0];
  const token = await createSessionToken({
    userId: user.id,
    companyId: membership.companyId,
    membershipRole: membership.role,
    platformRole: user.platformRole,
  });

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }),
    db.auditLog.create({
      data: {
        action: "auth.login_success",
        entity: "User",
        entityId: user.id,
        userId: user.id,
        companyId: membership.companyId,
        ipAddress: ip,
        userAgent: request.headers.get("user-agent"),
      },
    }),
  ]);

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: sessionCookieName,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
