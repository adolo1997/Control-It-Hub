import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";

export const sessionCookieName = "cih_session";

export const sessionPayloadSchema = z.object({
  userId: z.string().min(1),
  companyId: z.string().min(1),
  membershipRole: z.enum(["OWNER", "ADMIN", "TECH", "BILLING", "VIEWER"]),
  platformRole: z.enum(["SUPER_ADMIN", "USER"]),
});

export type SessionPayload = z.infer<typeof sessionPayloadSchema>;

export type VerifiedSessionPayload = SessionPayload & {
  iat?: number;
  exp?: number;
};

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET debe tener al menos 32 caracteres.");
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  const parsedPayload = sessionPayloadSchema.parse(payload);

  return new SignJWT(parsedPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getSecretKey());
  const parsedPayload = sessionPayloadSchema.parse(payload);

  return {
    ...parsedPayload,
    iat: typeof payload.iat === "number" ? payload.iat : undefined,
    exp: typeof payload.exp === "number" ? payload.exp : undefined,
  } satisfies VerifiedSessionPayload;
}
