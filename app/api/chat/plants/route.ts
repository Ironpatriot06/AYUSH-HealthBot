import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { access, id } = await req.json();

  const res = NextResponse.json({ ok: true });
  res.cookies.set("accessToken", access, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 3600,
  });

  res.cookies.set("idToken", id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 3600,
  });

  return res;
}
