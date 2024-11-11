import { NextResponse } from "next/server";
import { getClient } from "../../../lib/db";

const names: string[] = ["トリコ", "サニー", "ココ", "ゼブラ"];

export async function GET() {
  const client = getClient();

  try {
    await client.connect();
    const counts: { [K: string]: number } = {};
    await Promise.all(
      names.map(async (name) => {
        const res = await client.query(
          "SELECT COUNT(*) FROM winners WHERE content = $1",
          [name]
        );
        const count = res.rows[0].count;
        counts[name] = count;
      })
    );

    return new Response(JSON.stringify(counts), { status: 200 });
  } catch (error) {
    console.error("Failed to retrieve winners log", error);
    return NextResponse.json(
      { error: "Error fetching winner's log" },
      { status: 500 }
    );
  }
}
