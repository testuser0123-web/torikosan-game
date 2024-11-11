// app/api/getPosts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getClient } from "../../../lib/db";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  let offset = parseInt(url.searchParams.get("offset") || "-1", 10);
  let limit = parseInt(url.searchParams.get("limit") || "5", 10);
  const client = getClient();

  try {
    await client.connect();
    if (offset === -1) {
      const result = await client.query("SELECT COUNT(*) FROM posts");
      const rowCount = parseInt(result.rows[0].count, 10); // 行数を数値に変換
      if (rowCount < 5) {
        offset = 0;
        limit = rowCount;
      } else {
        offset = rowCount - limit;
      }
    } else if (offset <= 5) {
      limit = offset - 1;
      offset = 0;
    } else {
      offset = offset - limit - 1;
    }
    if (offset < 0) offset = 0;
    // console.log(`limit=${limit}, offset=${offset}`);
    const result = await client.query(
      "SELECT * FROM posts LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    return NextResponse.json(result.rows.reverse());
  } catch (error) {
    console.error("Failed to retrieve posts:", error);
    return NextResponse.json(
      { error: "Failed to retrieve posts" },
      { status: 500 }
    );
  }
}
