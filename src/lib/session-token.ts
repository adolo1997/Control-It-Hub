import { jwtVerify, SignJWT } from "jose";

export const sessionCookieName = "cih_session";

export type SessionPayload = {
  userId: string;
  companyId: string;
  membershipRole: string;
  platformRole: string;
};

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET debe tener al menos 32 caracteres.");
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getSecretKey());

  return payload as SessionPayload & {
    iat: number;
    exp: number;
  };
}
