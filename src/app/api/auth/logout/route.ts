import { NextRequest, NextResponse } from "next/server";

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

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  return clearSessionCookie(response);
}

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  return clearSessionCookie(response);
}
