// app/api/getPosts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getClient } from "../../../lib/db";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = parseInt(url.searchParams.get("id") || "0", 10);
  const client = getClient();

  try {
    await client.connect();
    const result = await client.query(
      "SELECT * FROM posts WHERE id > $1 ORDER BY id DESC",
      [id]
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
