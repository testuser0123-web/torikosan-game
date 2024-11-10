// app/api/getPosts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getClient } from "../../../lib/db";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "5", 10);
  const offset = (page - 1) * limit;
  const client = getClient();

  try {
    await client.connect();
    const result = await client.query(
      "SELECT * FROM posts ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [limit, offset]
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
