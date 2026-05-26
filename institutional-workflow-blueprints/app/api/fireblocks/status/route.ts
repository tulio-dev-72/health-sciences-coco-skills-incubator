import { NextResponse } from "next/server";
import { getFireblocksStatus } from "@/lib/fireblocks/service";

export async function GET() {
  return NextResponse.json(getFireblocksStatus());
}
