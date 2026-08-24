import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { code } = await request.json();
  const expected = process.env.INVITE_CODE;

  // If no invite code is configured, self-registration is disabled (invite-only).
  if (!expected) {
    return NextResponse.json({ valid: false, disabled: true });
  }

  if (typeof code !== "string" || code.trim() !== expected) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true });
}
