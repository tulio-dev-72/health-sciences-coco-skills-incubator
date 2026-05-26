import "server-only";

import { NextResponse } from "next/server";

import { getFireblocksIntegrationStatus, isFireblocksConfigured } from "@/lib/fireblocks/config";

export function fireblocksUnavailableResponse() {
  const integration = getFireblocksIntegrationStatus();

  return NextResponse.json(
    {
      error: "Fireblocks offline",
      integrationStatus: integration.integrationStatus,
      message: integration.message,
      configured: false,
    },
    { status: 503 },
  );
}

export function requireFireblocksConfigured() {
  if (!isFireblocksConfigured()) {
    return fireblocksUnavailableResponse();
  }

  return null;
}
