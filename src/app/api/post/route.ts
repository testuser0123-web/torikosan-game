// app/api/post/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getClient } from "../../../lib/db";
import dns from "dns";

interface PostRequestBody {
  content: string;
  userId: string;
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
const NG_IP: string[] = [];

/**
 * IPアドレスが逆引きできるかどうかを確認する関数
 * @param ipAddress - チェックするIPアドレス
 * @returns 逆引きが可能ならtrue、不可能ならfalse
 */
async function isResolvableHost(ipAddress: string): Promise<boolean> {
  return new Promise((resolve) => {
    dns.reverse(ipAddress, (err, hostnames) => {
      if (err || hostnames.length === 0) {
        // 逆引き失敗（逆引きできない）
        resolve(false);
        return;
      }

      // 正引きが元のIPと一致するか確認
      const hostname = hostnames[0];
      dns.lookup(hostname, (err, address) => {
        if (err || address !== ipAddress) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  });
}

export async function POST(req: NextRequest) {
  const ipAddress =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("remote-addr") ||
    null;
  const userAgent = req.headers.get("user-agent") || "User-Agent not available";
  const { content, userId }: PostRequestBody = await req.json();
  const timestamp = new Date().toISOString();
  const client = getClient();

  if (ipAddress && typeof ipAddress === "string") {
    const isResolvable = await isResolvableHost(ipAddress);
    if (!isResolvable) {
      return NextResponse.json(
        { error: "アクセスが制限されています" },
        { status: 403 }
      );
    }
  } else if (ipAddress === null) {
    return NextResponse.json(
      { error: "アクセスが制限されています" },
      { status: 403 }
    );
  }

  if (!call.some((keyword) => keyword === content)) {
    return NextResponse.json({ error: "Invalid string" }, { status: 500 });
  }

  try {
    await client.connect();
    // NG処理
    if (NG_IP.includes(ipAddress)) {
      return NextResponse.json({ error: "ホスト規制中" }, { status: 500 });
    }
    // 最後の投稿が1秒以内または、
    // 10秒以内に10個以上投稿してたら制限
    const lastPostResult = await client.query(
      "SELECT created_at FROM posts WHERE ip_address = $1 AND created_at >= NOW() - INTERVAL '10 seconds' ORDER BY created_at DESC LIMIT 10",
      [ipAddress]
    );
    const lastPostTime = lastPostResult.rows[0]?.created_at;
    const currentTime = new Date();
    if (
      lastPostTime &&
      currentTime.getTime() - new Date(lastPostTime).getTime() < 1000
    ) {
      return NextResponse.json(
        { error: "1秒以内の連続投稿はできません。" },
        { status: 429 }
      );
    } else if (lastPostResult.rows.length >= 10) {
      return NextResponse.json({ error: "投稿しすぎです。" }, { status: 429 });
    }

    await client.query(
      "INSERT INTO posts (content, created_at, img, user_id, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6)",
      [content, timestamp, img_path[content], userId, ipAddress, userAgent]
    );
    const result = await client.query(
      "SELECT * FROM posts ORDER BY id DESC LIMIT 6"
    );
    if (result.rows.length >= 4) {
      const contents = result.rows.map((row) => row.content);
      const allSame =
        contents[0] === "小松ゥ！"
          ? contents.length >= 6 &&
            contents[5] === "トリコさん！" &&
            contents
              .slice(0, 5)
              .every(
                (content) =>
                  content === contents[0] && content !== "トリコさん！"
              )
          : contents[3] === "トリコさん！" &&
            contents
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
        await client.query(
          "INSERT INTO winners (content, created_at, img) VALUES ($1, $2, $3)",
          [name[content], timestamp, img_path[content]]
        );
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save post:", error);
    return NextResponse.json({ error: "Failed to save post" }, { status: 500 });
  } finally {
    client.end();
  }
}
