import { cookies } from "next/headers";
import { cache } from "react";

import { db } from "@/lib/db";
import { sessionCookieName, verifySessionToken } from "@/lib/session-token";

export const getCurrentSession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = await verifySessionToken(token);
    const user = await db.user.findFirst({
      where: { id: payload.userId, isActive: true },
      include: {
        memberships: {
          where: { companyId: payload.companyId },
          include: { company: true },
          take: 1,
        },
      },
    });

    const membership = user?.memberships[0];
    if (!user || !membership) {
      return null;
    }

    return {
      user,
      company: membership.company,
      membershipRole: membership.role,
      platformRole: user.platformRole,
    };
  } catch {
    return null;
  }
});

export function canManageCompany(role: string) {
  return ["OWNER", "ADMIN"].includes(role);
}
