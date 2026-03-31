// app/api/set-auth/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { access, id } = await req.json();

  // you might want to validate the tokens here too before setting cookies.
  const res = NextResponse.json({ ok: true });

  res.cookies.set("accessToken", access, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 3600, // Access token lifetime (1 hour)
  });

  res.cookies.set("idToken", id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 3600,
  });

  return res;
}
