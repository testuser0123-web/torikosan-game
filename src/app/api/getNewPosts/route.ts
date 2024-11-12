// app/api/getPosts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getClient } from "../../../lib/db";
import { QueryResult } from "@vercel/postgres";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = parseInt(url.searchParams.get("id") || "0", 10);
  const limit = parseInt(url.searchParams.get("limit") || "30", 10);
  const client = getClient();

  try {
    await client.connect();
    let result: QueryResult;
    if (id === 0) {
      result = await client.query(
        "SELECT * FROM posts ORDER BY id DESC LIMIT 10"
      );
    } else {
      result = await client.query(
        "SELECT * FROM posts WHERE id > $1 ORDER BY id DESC LIMIT $2",
        [id, limit]
      );
    }
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to retrieve posts:", error);
    return NextResponse.json(
      { error: "Failed to retrieve posts" },
      { status: 500 }
    );
  } finally {
    client.end();
  }
}
