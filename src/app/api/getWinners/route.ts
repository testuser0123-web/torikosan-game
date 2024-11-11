// app/api/getPosts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getClient } from "../../../lib/db";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);
  const client = getClient();

  try {
    await client.connect();
    const result = await client.query(
      "SELECT * FROM winners ORDER BY id DESC LIMIT $1",
      [limit]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to retrieve posts:", error);
    return NextResponse.json(
      { error: "Failed to retrieve posts" },
      { status: 500 }
    );
  }
}
