import { NextRequest, NextResponse } from "next/server";
import { validateConnection } from "@/lib/graph";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { player1Id, player2Id } = body;

  if (!player1Id || !player2Id) {
    return NextResponse.json(
      { valid: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  const result = validateConnection(player1Id, player2Id);
  return NextResponse.json({
    ...result,
    error: result.valid ? undefined : "These players were never teammates",
  });
}
