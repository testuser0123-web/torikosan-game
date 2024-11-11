import { NextResponse } from "next/server";
import { getClient } from "../../../lib/db";

export async function GET() {
  const client = getClient();

  try {
    await client.connect();
    const result = await client.query(
      "SELECT * FROM winners ORDER BY id DESC LIMIT 1"
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to retrieve winners:", error);
    return NextResponse.json(
      { error: "Failed to retrieve winners" },
      { status: 500 }
    );
  } finally {
    client.end();
  }
}
