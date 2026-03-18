import { NextRequest, NextResponse } from "next/server";
import { findShortestPath } from "@/lib/graph";

export async function GET(request: NextRequest) {
  const startId = Number(request.nextUrl.searchParams.get("startId"));
  const endId = Number(request.nextUrl.searchParams.get("endId"));

  if (!startId || !endId) {
    return NextResponse.json({ error: "Missing startId or endId" }, { status: 400 });
  }

  const result = findShortestPath(startId, endId);
  return NextResponse.json(result);
}
