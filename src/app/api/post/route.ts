// app/api/post/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getClient } from "../../../lib/db";

interface PostRequestBody {
  content: string;
}

const call = ["トリコさん！", "小松ゥ！", "マツ！", "小松くん！", "小僧ォ！"];
const img_path: { [K: string]: string } = {
  "トリコさん！": "Komatsu.png",
  "小松ゥ！": "Toriko.png",
  "マツ！": "Sunny.png",
  "小松くん！": "Coco.png",
  "小僧ォ！": "Zebra.png",
};
const name: { [K: string]: string } = {
  "トリコさん！": "小松",
  "小松ゥ！": "トリコ",
  "マツ！": "サニー",
  "小松くん！": "ココ",
  "小僧ォ！": "ゼブラ",
};

export async function POST(req: NextRequest) {
  const { content }: PostRequestBody = await req.json();
  const timestamp = new Date().toISOString();
  const client = getClient();

  if (!call.some((keyword) => keyword === content)) {
    return NextResponse.json({ error: "Invalid string" }, { status: 500 });
  }

  try {
    await client.connect();
    await client.query(
      "INSERT INTO posts (content, created_at, img) VALUES ($1, $2, $3)",
      [content, timestamp, img_path[content]]
    );
    const result = await client.query(
      "SELECT * FROM posts ORDER BY id DESC LIMIT 5"
    );
    if (result.rows.length >= 3) {
      const contents = result.rows.map((row) => row.content);
      const allSame =
        contents[0] === "小松ゥ！"
          ? contents.length === 5 &&
            contents.every(
              (content) => content === contents[0] && content !== "トリコさん！"
            )
          : contents
              .slice(0, 3)
              .every(
                (content) =>
                  content === contents[0] && content !== "トリコさん！"
              );
      if (allSame) {
        await client.query(
          "INSERT INTO posts (content, created_at, img) VALUES ($1, $2, $3)",
          [`${name[content]}の勝ち！`, timestamp, img_path[content]]
        );
        await client.query(
          "INSERT INTO posts (content, created_at, img) VALUES ($1, $2, $3)",
          ["トリコさん！", timestamp, "Komatsu.png"]
        );
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save post:", error);
    return NextResponse.json({ error: "Failed to save post" }, { status: 500 });
  }
}
