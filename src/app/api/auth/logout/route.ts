import { NextResponse } from "next/server";

import { sessionCookieName } from "@/lib/session-token";

function clearSessionCookie(response: NextResponse) {
  response.cookies.delete(sessionCookieName);
  response.cookies.set({
    name: sessionCookieName,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}

function redirectToLogin(status = 302) {
  return new NextResponse(null, {
    status,
    headers: {
      "Cache-Control": "no-store",
      Location: "/login",
    },
  });
}

export async function GET() {
  const response = redirectToLogin();
  return clearSessionCookie(response);
}

export async function POST() {
  const response = redirectToLogin(303);
  return clearSessionCookie(response);
}
