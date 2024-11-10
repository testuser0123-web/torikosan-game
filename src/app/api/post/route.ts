// app/api/post/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getClient } from "../../../lib/db";

interface PostRequestBody {
  content: string;
}

export async function POST(req: NextRequest) {
  const { content }: PostRequestBody = await req.json();
  const timestamp = new Date().toISOString();
  const client = getClient();

  try {
    await client.connect();
    await client.query(
      "INSERT INTO posts (content, created_at) VALUES ($1, $2)",
      [content, timestamp]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save post:", error);
    return NextResponse.json({ error: "Failed to save post" }, { status: 500 });
  }
}
