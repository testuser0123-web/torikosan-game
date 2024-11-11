import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const ipAddress =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("remote-addr") ||
    "IP not available";
  const userAgent =
    request.headers.get("user-agent") || "User-Agent not available";
  return NextResponse.json({ ip: ipAddress, ua: userAgent });
}
